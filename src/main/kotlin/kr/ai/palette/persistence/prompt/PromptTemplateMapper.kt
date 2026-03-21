package kr.ai.palette.persistence.prompt

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import kr.ai.palette.domain.prompt.PromptId
import kr.ai.palette.domain.prompt.PromptTemplate
import org.springframework.stereotype.Component

@Component
class PromptTemplateMapper(
    private val objectMapper: ObjectMapper
) {
    fun toDomain(entity: PromptTemplateEntity): PromptTemplate {
        return PromptTemplate(
            id = PromptId.from(entity.id),
            name = entity.name,
            description = entity.description,
            category = entity.category,
            template = entity.template,
            variables = objectMapper.readValue(entity.variables),
            systemMessage = entity.systemMessage,
            temperature = entity.temperature,
            maxTokens = entity.maxTokens,
            version = entity.version,
            status = entity.status,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }

    fun toEntity(domain: PromptTemplate): PromptTemplateEntity {
        return PromptTemplateEntity(
            id = domain.id.value,
            name = domain.name,
            description = domain.description,
            category = domain.category,
            template = domain.template,
            variables = objectMapper.writeValueAsString(domain.variables),
            systemMessage = domain.systemMessage,
            temperature = domain.temperature,
            maxTokens = domain.maxTokens,
            version = domain.version,
            status = domain.status,
            createdAt = domain.createdAt,
            updatedAt = domain.updatedAt
        )
    }

    fun updateEntity(entity: PromptTemplateEntity, domain: PromptTemplate) {
        entity.name = domain.name
        entity.description = domain.description
        entity.category = domain.category
        entity.template = domain.template
        entity.variables = objectMapper.writeValueAsString(domain.variables)
        entity.systemMessage = domain.systemMessage
        entity.temperature = domain.temperature
        entity.maxTokens = domain.maxTokens
        entity.version = domain.version
        entity.status = domain.status
        entity.updatedAt = domain.updatedAt
    }
}
