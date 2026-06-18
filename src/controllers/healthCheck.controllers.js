import { ApiResponse } from "../utils/api-response.js";

const healthCheck = async (req, res) => {
    try {
        console.log("Health check route hit");

        return res.status(200).json(
            new ApiResponse(
                200,
                { message: "Server is running" },
                "Health check successful"
            )
        );

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export { healthCheck };  