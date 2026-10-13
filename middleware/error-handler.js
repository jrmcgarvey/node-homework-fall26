const serverError = async (err, req, res, next) => {
    res.status(500).json({message: "A server error occurred"})
    console.error("A server error occurred: ", err)
}

module.exports = serverError