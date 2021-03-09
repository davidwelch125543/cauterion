/**
* 	@swagger
* /admin/users:
*  post:
*   tags:
*    - 'admin'
*   security:
*    - bearerAuth: []
*   requestBody:
*    content:
*     application/json:
*      schema:
*       type: object
*       properties:
*        LastEvaluatedKey:
*         type: object
*         properties:
*          id:
*           type: string
*          createdAt:
*           type: integer
*          type:
*           type: string 
*   responses:
*    '200':
*     description: Successful operation
*/