/**
 * Utilitários para formatação de dados
 * @module utils/formatters
 */

const moment = require('moment');

/**
 * Formata a duração entre uma data passada e agora
 * @param {Moment} startDate - Data inicial em formato Moment
 * @returns {string} Duração formatada
 */
function formatDuration(startDate) {
  const now = moment();
  const duration = moment.duration(now.diff(startDate));
  
  const years = Math.floor(duration.asYears());
  const months = Math.floor(duration.asMonths()) % 12;
  const days = Math.floor(duration.asDays()) % 30;
  const hours = Math.floor(duration.asHours()) % 24;
  
  const parts = [];
  if (years > 0) parts.push(`${years} ano${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mês${months !== 1 ? 'es' : ''}`);
  if (days > 0) parts.push(`${days} dia${days !== 1 ? 's' : ''}`);
  if (hours > 0 && years === 0 && months === 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
  
  return parts.length > 0 ? parts.join(', ') : 'menos de uma hora';
}

module.exports = {
  formatDuration
};
