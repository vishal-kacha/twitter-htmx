const path = require("path");
const app = require("express")();

app.use(require("express").static(path.join(__dirname, "./public")));

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
