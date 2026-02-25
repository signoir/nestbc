import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { DEPRECATED_KEY, DeprecatedOptions } from '../decorators/deprecated.decorator';

/**
 * Centralized sunset date configuration for deprecated endpoints.
 * Only endpoints listed here will have deprecation headers added.
 * 
 * Key: Endpoint path pattern
 * Value: Sunset date (ISO 8601 format)
 */
const SUNSET_MAP: Record<string, string> = {
  // Example: Mark specific V1 endpoints for deprecation
  // '/api/v1/users': '2027-03-01',
  // '/api/v1/auth/login': '2027-03-01',
  // Add endpoints here as they are marked for deprecation
};

/**
 * Global interceptor that adds deprecation headers to responses.
 * 
 * Features:
 * - Selective deprecation: Only endpoints in SUNSET_MAP get headers
 * - Centralized configuration: All sunset dates in one place
 * - Automatic header injection: No controller boilerplate
 * 
 * Headers added:
 * - Deprecation: true
 * - Sunset: <date from SUNSET_MAP>
 * - Link: </api/v2/...>; rel="successor-version"
 */
@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DeprecationInterceptor.name);

  constructor(@Optional() private reflector?: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const endpoint = request.path;

    // Check if endpoint has @Deprecated decorator with explicit options
    const decoratorOptions = this.reflector?.get<DeprecatedOptions>(
      DEPRECATED_KEY,
      context.getHandler(),
    );

    // Check if endpoint is in SUNSET_MAP
    const sunsetDate = this.getSunsetDate(endpoint);

    // Only add headers if endpoint is marked for deprecation
    if (decoratorOptions || sunsetDate) {
      const options = decoratorOptions || {};
      const sunset = sunsetDate || options.sunset;

      // Add deprecation headers
      response.setHeader('Deprecation', 'true');
      
      if (sunset) {
        response.setHeader('Sunset', sunset);
      }

      if (options.successor) {
        response.setHeader(
          'Link',
          `<${options.successor}>; rel="successor-version"`,
        );
      }

      this.logger.debug(
        `Deprecation headers added for ${endpoint}${sunset ? ` (sunset: ${sunset})` : ''}`,
      );
    }

    return next.handle().pipe(
      tap(() => {
        // Add X-API-Version header to all responses
        const version = this.extractVersion(endpoint);
        if (version) {
          response.setHeader('X-API-Version', version);
        }
      }),
    );
  }

  /**
   * Get sunset date for endpoint from SUNSET_MAP.
   * Supports exact match and prefix match for path patterns.
   */
  private getSunsetDate(endpoint: string): string | undefined {
    // Exact match
    if (SUNSET_MAP[endpoint]) {
      return SUNSET_MAP[endpoint];
    }

    // Prefix match (for paths with parameters like /api/v1/users/:id)
    for (const [path, sunset] of Object.entries(SUNSET_MAP)) {
      if (endpoint.startsWith(path)) {
        return sunset;
      }
    }

    return undefined;
  }

  /**
   * Extract API version from endpoint path.
   * Examples:
   * - /api/v1/users -> v1
   * - /api/v2/users/123 -> v2
   * - /health -> undefined
   */
  private extractVersion(endpoint: string): string | undefined {
    const match = endpoint.match(/\/api\/(v\d+)\//);
    return match ? match[1] : undefined;
  }
}
