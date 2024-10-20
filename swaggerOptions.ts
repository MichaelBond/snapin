export default {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'API documentation for your project',
        },
        components: {
            schemas: {
                Login: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'The user\'s email address',
                            example: 'user@example.com',
                        },
                        password: {
                            type: 'string',
                            description: 'The user\'s password',
                            example: 'password123',
                        },
                    },
                    required: ['email', 'password'],
                },
            },
        },
        servers: [
            {
                url: 'http://localhost:4000', // Base URL of your API
            },
        ],
    },
    apis: ['./routes/*.ts'], // Adjust the path to your route files
};
