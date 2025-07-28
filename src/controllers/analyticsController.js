import { getSegmentsSentData } from "../services/analyticsService.js";
import { formatPhoneNumber } from "../utils/helper.js";

export const segmentsSentHandler = async (req, res) => {
    try {
        const { number, startDate, endDate } = req.query;
        
        if (!number || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Missing required parameters: number, startDate, endDate'
            });
        }
        // const formattedPhone = formatPhoneNumber(number);
        const result = await getSegmentsSentData({ number, startDate, endDate });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            data: []
        });
    }
};