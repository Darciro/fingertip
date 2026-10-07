<?php

namespace App\Database;

use Illuminate\Database\Connectors\PostgresConnector;

/**
 * Sends the Neon endpoint ID in the connection options.
 *
 * Neon routes connections by SNI, which older libpq builds (common on shared
 * hosting) don't send, causing "Endpoint ID is not specified". Passing
 * options=endpoint=<id> works with and without SNI.
 *
 * @see https://neon.com/sni
 */
class NeonPostgresConnector extends PostgresConnector
{
    /**
     * Create a DSN string from a configuration.
     *
     * @param  array<string, mixed>  $config
     * @return string
     */
    protected function getDsn(array $config)
    {
        $dsn = parent::getDsn($config);

        $host = (string) ($config['host'] ?? '');

        if (! str_ends_with($host, '.neon.tech') || str_contains($dsn, ';options=')) {
            return $dsn;
        }

        $endpoint = strstr($host, '.', true);

        return $dsn.";options='endpoint={$endpoint}'";
    }
}
