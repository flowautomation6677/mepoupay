const axios = require('axios');

const url = 'http://localhost:8080/instance/connectionState/FinanceBot_v3';
const headers = {
    'apikey': '429683C4C977415CAAFCCE10F7D57E11'
};

(async () => {
    try {
        const response = await axios.get(url, { headers });
        console.log("Status:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response:", error.response.data);
        }
    }
})();
