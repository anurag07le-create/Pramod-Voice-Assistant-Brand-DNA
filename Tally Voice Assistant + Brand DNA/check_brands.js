import { fetchBrands } from './src/services/googleSheetsService.js';

const checkMatch = async () => {
    try {
        console.log("Fetching brands...");
        // Need to mock fetch because we are in node environment where fetch might need polyfill 
        // or ensure node version supports it (Node 18+).
        // For simplicity, I will assume the environment supports fetch (User OS windows, modern node likely).

        const brands = await fetchBrands();
        console.log(`Fetched ${brands.length} brands.`);

        const target = "Samsung";
        const found = brands.find(b => b.name.toLowerCase().includes(target.toLowerCase()));

        if (found) {
            console.log("Found match:", found.name);
            console.log("Logo:", found.logo);
        } else {
            console.log("No match found for:", target);
            console.log("Available brands:", brands.map(b => b.name).join(", "));
        }
    } catch (e) {
        console.error("Error:", e);
    }
};

checkMatch();
