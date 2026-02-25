import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export interface DeprecatedOptions {
  sunset?: string;  // ISO 8601 date (e.g., '2027-03-01')
  successor?: string;  // URL of successor version (e.g., '/api/v2/users')
  message?: string;  // Custom deprecation message
}

export const DEPRECATED_KEY = 'deprecated';

/**
 * Marks an endpoint as deprecated with optional sunset date and successor version.
 * 
 * @example
 * @Deprecated({
 *   sunset: '2027-03-01',
 *   successor: '/api/v2/users',
 *   message: 'V1 user endpoints are deprecated. Please migrate to V2.',
 * })
 */
export const Deprecated = (options: DeprecatedOptions = {}) => {
  return applyDecorators(
    SetMetadata(DEPRECATED_KEY, options),
    ApiHeader({
      name: 'Deprecation',
      description: 'Indicates this endpoint is deprecated',
      required: false,
      schema: { default: 'true' },
    }),
    ApiHeader({
      name: 'Sunset',
      description: 'Date when this endpoint will be removed (ISO 8601)',
      required: false,
      schema: { default: options.sunset },
    }),
    ApiHeader({
      name: 'Link',
      description: 'Link to successor version',
      required: false,
      schema: {
        default: options.successor
          ? `<${options.successor}>; rel="successor-version"`
          : undefined,
      },
    }),
  );
};
