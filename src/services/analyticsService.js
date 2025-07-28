import { docClient } from "../utils/dynamodbconfig.js";

export const getSegmentsSentData = async ({ number, startDate, endDate }) => {
    try {
        // Convert date strings to timestamp ranges for querying
        const startTimestamp = new Date(startDate + 'T00:00:00.000Z').getTime();
        const endTimestamp = new Date(endDate + 'T23:59:59.999Z').getTime();
        
        // Since we're using composite keys (number#timestamp), we need to scan the table
        // to find all records within the date range for the given number
        const scanParams = {
            TableName: "analytics",
            FilterExpression: "(original_number = :number OR begins_with(#num, :numberPrefix)) AND #date.#start >= :startTime AND #date.#start <= :endTime",
            ExpressionAttributeNames: {
                "#num": "number",
                "#date": "date",
                "#start": "start"
            },
            ExpressionAttributeValues: {
                ":number": number,
                ":numberPrefix": number + "#",
                ":startTime": startTimestamp,
                ":endTime": endTimestamp
            }
        };
        const result = await docClient.scan(scanParams).promise();
        
        // Group data by date and sum segments_sent for each day
        const groupedData = {};
        
        result.Items.forEach(item => {
            const dateStart = item.date.start;
            const dateObj = new Date(dateStart);
            const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            if (!groupedData[dateKey]) {
                groupedData[dateKey] = {
                    date: dateKey,
                    segments_sent: 0,
                    count: 0
                };
            }
            
            groupedData[dateKey].segments_sent += item.segments_sent || 0;
            groupedData[dateKey].count += 1;
        });
        
        // Convert to array and sort by date
        const chartData = Object.values(groupedData)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(item => ({
                date: item.date,
                segments: item.segments_sent,
                // Format date for display (e.g., "Jul 26")
                displayDate: new Date(item.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                })
            }));
        
        return {
            success: true,
            data: chartData,
            totalSegments: chartData.reduce((sum, item) => sum + item.segments, 0)
        };
        
    } catch (error) {
        console.error('Error fetching segments sent data:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
};