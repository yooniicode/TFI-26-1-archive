package com.byby.backend.domain.medicalscript.service;

import com.byby.backend.common.exception.BusinessException;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.consultation.entity.Consultation;
import com.byby.backend.domain.consultation.repository.ConsultationRepository;
import com.byby.backend.domain.medicalscript.dto.ScriptRequest;
import com.byby.backend.domain.medicalscript.dto.ScriptResponse;
import com.byby.backend.domain.medicalscript.entity.MedicalScript;
import com.byby.backend.domain.medicalscript.repository.MedicalScriptRepository;
import com.byby.backend.domain.patient.entity.Patient;
import com.byby.backend.domain.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicalScriptService {

    private final MedicalScriptRepository scriptRepository;
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;
    private final RestClient restClient;

    @Value("${byby.claude.model}")
    private String claudeModel;

    @Transactional
    public ScriptResponse.Detail generate(ScriptRequest.Generate req, UserPrincipal principal) {
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));

        if (principal.isPatient()) {
            Patient self = patientRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
            if (!self.getId().equals(patient.getId())) {
                throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
            }
        } else if (!principal.isAdmin() && !principal.isInterpreter()) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }

        Consultation consultation = null;
        if (req.consultationId() != null) {
            consultation = consultationRepository.findById(req.consultationId()).orElse(null);
        }

        String prompt = buildPrompt(patient, consultation, req);
        String contentKo = callClaudeApi(prompt);

        MedicalScript script = MedicalScript.builder()
                .patient(patient)
                .consultation(consultation)
                .scriptType(req.scriptType())
                .contentKo(contentKo)
                .build();
        return ScriptResponse.Detail.from(scriptRepository.save(script));
    }

    public Page<ScriptResponse.Summary> getByPatient(UUID patientId, Pageable pageable, UserPrincipal principal) {
        if (principal.isPatient()) {
            Patient self = patientRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
            if (!self.getId().equals(patientId)) {
                throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
            }
        } else if (!principal.isAdmin() && !principal.isInterpreter()) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
        return scriptRepository.findByPatientId(patientId, pageable).map(ScriptResponse.Summary::from);
    }

    public ScriptResponse.Detail getById(UUID id, UserPrincipal principal) {
        MedicalScript script = scriptRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.SCRIPT_NOT_FOUND));
        if (principal.isPatient()) {
            Patient self = patientRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
            if (!self.getId().equals(script.getPatient().getId())) {
                throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
            }
        }
        return ScriptResponse.Detail.from(script);
    }

    private String buildPrompt(Patient patient, Consultation consultation, ScriptRequest.Generate req) {
        StringBuilder sb = new StringBuilder();
        sb.append("다음 이주민 환자 정보를 바탕으로 의사에게 전달할 한국어 대본을 작성해주세요.\n\n");
        sb.append("환자 국적: ").append(patient.getNationality()).append("\n");
        if (consultation != null && consultation.getMemo() != null) {
            sb.append("이전 상담 기록: ").append(consultation.getMemo()).append("\n");
            if (consultation.getDepartment() != null) {
                sb.append("진료과: ").append(consultation.getDepartment()).append("\n");
            }
        }
        if (req.additionalContext() != null) {
            sb.append("추가 증상/상황: ").append(req.additionalContext()).append("\n");
        }
        sb.append("\n대본 유형: ").append(req.scriptType() == com.byby.backend.common.enums.ScriptType.EMERGENCY
                ? "응급 상황" : "일반 진료").append("\n");
        sb.append("\n요구사항: 짧고 명확한 한국어 문장으로 작성. 환자가 의사에게 직접 보여줄 수 있도록 구성.");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String callClaudeApi(String prompt) {
        try {
            Map<String, Object> body = Map.of(
                    "model", claudeModel,
                    "max_tokens", 1024,
                    "system", "당신은 의료 통역 보조 시스템입니다. 이주민 환자가 한국 의사와 소통할 수 있도록 정확하고 간결한 한국어 대본을 작성합니다.",
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            Map<String, Object> response = restClient.post()
                    .uri("/v1/messages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("content")) {
                List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
                if (!content.isEmpty()) {
                    return (String) content.get(0).get("text");
                }
            }
            throw new BusinessException(BusinessErrorCode.SCRIPT_GENERATION_FAILED);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Claude API call failed: {}", e.getMessage());
            throw new BusinessException(BusinessErrorCode.SCRIPT_GENERATION_FAILED);
        }
    }
}
