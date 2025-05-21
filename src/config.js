// Configuration management
export async function getConfig(key) {
    return await window.api.getConfig(key);
}

export async function saveConfig(key, value) {
    return await window.api.saveConfig(key, value);
}

export async function getAllConfig() {
    return await window.api.getConfig();
}

// Garante que a configuração wizardOnlyFirstInitialize está definida como false por padrão
export async function ensureWizardAlwaysShows() {
    let value = await getConfig('wizardOnlyFirstInitialize');
    if (value !== false) {
        await saveConfig('wizardOnlyFirstInitialize', false);
    }
}