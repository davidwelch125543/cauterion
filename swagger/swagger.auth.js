/**
* @swagger
* components:
*  securitySchemes:
*   bearerAuth:
*    type: http
*    scheme: bearer
*    bearerFormat: JWT
*
*/

/**
* 	@swagger
*
* /auth/login:
*  post:
*   tags:
*    - 'auth'
*   requestBody:
*    content:
*     application/json:
*      schema:
*       type: object
*       properties:
*        login:
*         type: string
*        password:
*         type: string
*   responses:
*    '200':
*     description: Successful operation
*/