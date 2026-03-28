<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Sanctum Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | development domain and any other domain you plan to use.
    |
    */

    'stateful' => explode(',', env(
        'SANCTUM_STATEFUL_DOMAINS',
        'localhost,127.0.0.1,127.0.0.1:8000,localhost:8000,localhost:3000,127.0.0.1:3000'
    )),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guard
    |--------------------------------------------------------------------------
    |
    | This value defines the authentication guard that will be used when a
    | user is authenticated via Sanctum. The "api" guard will be used by
    | default and should suffice for the vast majority of applications.
    |
    */

    // Use the existing session guard defined in config/auth.php.
    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will
    | be considered expired. By default, tokens will be considered expired
    | after one week. Feel free to change this!
    |
    */

    'expiration' => 10080,

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    |
    | Sanctum can prefix new tokens with a given prefix. This will help you
    | identify the tokens within your application and throughout third-party
    | services that consume your API. By default, no prefix is used.
    |
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | When authenticating your first-party SPA with Sanctum, you may need to
    | customize some of the middleware Sanctum uses while processing requests.
    | You may change the middleware listed below as required by your application.
    |
    */

    'middleware' => [
        'verify_csrf_token' => \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => \Illuminate\Cookie\Middleware\EncryptCookies::class,
    ],
];
