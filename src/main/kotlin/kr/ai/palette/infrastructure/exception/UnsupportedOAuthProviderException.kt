package kr.ai.palette.infrastructure.exception

/**
 * Thrown when a client attempts to authenticate via an OAuth2 provider
 * that is not yet supported by the backend.
 */
class UnsupportedOAuthProviderException(val provider: String) :
    RuntimeException("OAuth2 provider '$provider' is not supported yet")
