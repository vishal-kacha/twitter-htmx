const { urlencoded } = require("express");
const path = require("path");
const app = require("express")();
const pg = require("pg");

app.use(urlencoded({ extended: true }));

const pool = new pg.Pool({
	host: "localhost",
	user: "postgres",
	database: "twitter",
	max: 20,
	ssl: false,
});

app.set("view engine", "ejs");

app.use(require("express").static(path.join(__dirname, "./public")));

app.get("/tweets", async (req, res) => {
	const query = `
			SELECT twittes.id, twittes.tweet, twittes.created_at, users.name, users.image 
			FROM twittes 
			JOIN users ON twittes.user_id = users.id
			ORDER BY twittes.created_at DESC
		`;
	const { rows } = await pool.query(query);

	res.render("home", { rows });
});

app.get("/:user", async (req, res) => {
	const user = req.params.user;

	const query = `
            SELECT users.name, users.image, twittes.tweet, twittes.created_at
            FROM users
            LEFT JOIN twittes ON users.id = twittes.user_id
            WHERE users.name = $1
            ORDER BY twittes.created_at DESC
        `;

	const { rows } = await pool.query(query, [user]);

	if (rows.length === 0) {
		return res.status(404).send("User not found");
	}
	const userData = {
		name: rows[0].name,
		image: rows[0].image,
		tweets: rows.map((row) => ({
			tweet: row.tweet,
			created_at: row.created_at,
		})),
	};

	res.render("user", { userData });
});

app.post("/post-tweet", async (req, res) => {
	const { name, tweet } = req.body;
	await pool.query(
		"INSERT INTO twittes (user_id, tweet) SELECT id, $1 FROM users WHERE name = $2",
		[tweet, name],
	);

	res.redirect("/tweets");
});

app.post("/search", async (req, res) => {
	const searchTerm = req.body.search;

	const query = `
		SELECT 'user' AS type, id, name AS title, image AS image, NULL AS tweet, NULL AS created_at
		FROM users
		WHERE name ILIKE '%' || $1 || '%'
		UNION ALL
		SELECT 'tweet' AS type, user_id AS id, NULL AS title, NULL AS image, tweet AS tweet, created_at
		FROM twittes
		WHERE tweet ILIKE '%' || $1 || '%';
  `;

	const { rows } = await pool.query(query, [searchTerm]);
	res.render("search", { results: rows });
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
