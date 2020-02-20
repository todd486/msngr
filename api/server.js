module.exports = ((res, req) => {
    const { name= 'World' } = req.query;
    res.status(200).send(`Hello ${name}!`)
})