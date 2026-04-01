
// Central Configuration for External Services

// Google Sheets Configuration
export const SHEET_CONFIG = {
    SPREADSHEET_ID: '1s1bWdUikqWCFXte618VXaxr5NBnmZG_igd_YZXAfSUY',

    // Worksheet GIDs
    CAMPAIGN_IDEAS_GID: '385062817',
    CREATIVES_GID: '113113531',
    ANIMATED_CREATIVES_GID: '322601545',
    CUSTOM_CREATIVES_GID: '1646027813', // Updated to new sheet

    // Other Sheets (if any)
    MARKET_INTELLIGENCE_ID: '1trmuPKla4JjrNEJbj0_Ll2uXpbws0g2e7FhXa4rUdDU',
    MARKET_INTELLIGENCE_GID: '454926026',

    // Tally Agent
    TALLY_AGENT_SPREADSHEET_ID: '1s1bWdUikqWCFXte618VXaxr5NBnmZG_igd_YZXAfSUY',
    TALLY_AGENT_GID: '73890494',
};

// Webhook URLs
export const WEBHOOKS = {
    // Brand DNA Generation
    GENERATE_DNA_URL: 'https://studio.pucho.ai/api/v1/webhooks/nJQLLImiYVwTNXx7652jv',
    GENERATE_DNA_PDF: 'https://studio.pucho.ai/api/v1/webhooks/Wj5VCKnXylQvYbvAA2BtN',

    // Campaign Ideas
    BRAINSTORM_CAMPAIGN: 'https://studio.pucho.ai/api/v1/webhooks/SbCkmZ1rl9ojnzRcLMKj9',

    // Creative Generation
    GENERATE_CREATIVES: 'https://studio.pucho.ai/api/v1/webhooks/HqLIzEdsWBE411KMNRhBF',
    CUSTOM_CREATIVES: 'https://studio.pucho.ai/api/v1/webhooks/CxA2MkhkzOHqW7PjtUcwo', // Also used for Refine
    ANIMATE_CREATIVES: 'https://studio.pucho.ai/api/v1/webhooks/PWGXbOrfXebCIGeut7lvX',

    // Other Tools
    COMPETITOR_ANALYSIS: 'https://studio.pucho.ai/api/v1/webhooks/competitor-analysis', // Placeholder/Verify
    AUDIO_TRANSCRIPTION: 'https://studio.pucho.ai/api/v1/webhooks/audio-transcription', // Placeholder/Verify
    MOM_SUMMARY: 'https://studio.pucho.ai/api/v1/webhooks/mom-summary', // Placeholder/Verify
};

export default { SHEET_CONFIG, WEBHOOKS };
