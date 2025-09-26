class apiResponse
{
    constructor(
        statusCode,
        message = "Success",
        data
    )
    {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
    }
    json(res)
    {
        res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            data: this.data
        });
    }
}

export default apiResponse;