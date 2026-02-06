# Security Notes

## Current Security Status (v1)

This is a v1 implementation focused on rapid development. The following security considerations should be addressed before production use:

### Known Limitations

1. **No Rate Limiting**: API endpoints that access databases are not rate-limited.
   - **Impact**: Potential for abuse through excessive requests
   - **Mitigation**: Use behind a reverse proxy with rate limiting (nginx, API gateway)
   - **Future**: Implement @fastify/rate-limit plugin

2. **Database Credentials in Request Bodies**: The `targetDatabaseUrl` is passed in request bodies.
   - **Impact**: Connection strings pass through logs, network layers
   - **Mitigation**: Use HTTPS, avoid logging request bodies
   - **Future**: Implement encrypted connection storage with `connectionId` references

3. **No Authentication/Authorization**: Endpoints are publicly accessible.
   - **Impact**: Anyone can access and run checks
   - **Mitigation**: Deploy behind authenticated API gateway or VPN
   - **Future**: Implement JWT or OAuth2 authentication

4. **SQL Injection Protection**: Parameterized queries are used throughout.
   - **Status**: ✅ Protected via pg parameterized queries
   - All user inputs are passed as parameters, not concatenated into SQL strings

5. **Input Validation**: All endpoints use Zod for input validation.
   - **Status**: ✅ Implemented
   - Request bodies are validated before processing

## Production Deployment Checklist

Before deploying to production:

- [ ] Add rate limiting (@fastify/rate-limit or API gateway)
- [ ] Implement authentication/authorization
- [ ] Store database credentials encrypted (not in request bodies)
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins (not `origin: true`)
- [ ] Set up monitoring and alerting
- [ ] Implement audit logging
- [ ] Add request size limits
- [ ] Configure database connection pooling limits
- [ ] Set up error tracking (Sentry, etc.)

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com (replace with actual contact).

Do not open public issues for security vulnerabilities.
