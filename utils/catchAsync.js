/*
This func returns a function that accepts an async function and executes it, while catching errors and passing them to 'next()'
*/

module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}