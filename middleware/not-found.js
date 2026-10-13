const notFound = async (req, res, next) => {
    res.status(404).json({message: `There is no route for ${req.method} requests to ${req.path}`})
}

module.exports = notFound
