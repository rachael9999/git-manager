/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         login:
 *           type: string
 *         id:
 *           type: integer
 *         avatar_url:
 *           type: string
 *         html_url:
 *           type: string
 *         name:
 *           type: string
 *         public_repos:
 *           type: integer
 *         followers:
 *           type: integer
 *         following:
 *           type: integer
 */

/**
 * @swagger
 * /user/{username}/repos_max_page:
 *   get:
 *     summary: Get maximum page count for user repositories
 *     description: Retrieves the maximum page number for a user's repositories
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *     responses:
 *       200:
 *         description: Maximum page number retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "5"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /user/{username}/repos/{page}:
 *   get:
 *     summary: Get user repositories by page
 *     description: Retrieves a paginated list of repositories for a specific user
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of repositories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Repository'
 *       303:
 *         description: Redirect to different page
 *       404:
 *         description: User or page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /user/{username}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieves detailed information about a GitHub user
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */