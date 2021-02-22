/**
* 	@swagger
* /users/health-info:
*  post:
*   tags:
*    - 'tickets'
*   security:
*    - bearerAuth: []
*   requestBody:
*    content:
*     multipart/form-data:
*      schema:
*       type: object
*       properties:
*        title:
*         type: string
*        text:
*         type: string
*        healthInfoImages:
*         type: array
*         items:
*          type: string
*          format: binary
*       required:
*        - "title"
*        - "text"
*   responses:
*    '200':
*     description: Successful operation
*/