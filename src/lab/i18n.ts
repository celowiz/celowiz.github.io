// Textos do /lab/ ficam num pacote próprio (namespace "lab" dentro de translation), fora dos
// JSON do portfólio: a página nova não mexe em src/i18n/pt.json e en.json.
import i18n from '../i18n';
import pt from './pt.json';
import en from './en.json';

i18n.addResourceBundle('pt', 'translation', { lab: pt }, true, true);
i18n.addResourceBundle('en', 'translation', { lab: en }, true, true);

export default i18n;
