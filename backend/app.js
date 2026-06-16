import express from "express"
import path from "path"
const app = express()
const port = process.env.PORT || 3000
app.use(express.json())
app.use(express.static(path.join(__dirname, "../frontend")))
app.listen(3000, () => {
    console.log("Server is running on port 3000")
})