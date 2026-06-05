// server/services/slaService.js

/**
 * Calcula a data adicionando horas (simples, sem considerar finais de semana por enquanto)
 */
function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Calcula a data adicionando minutos
 */
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

exports.calculateSLA = (nivel, dataAbertura = new Date()) => {
  let slaResposta, slaSolucao;

  switch (nivel) {
    case 'N2':
    case 'n2':
    case 'Analista N2':
      slaResposta = addHours(dataAbertura, 1);
      slaSolucao = addHours(dataAbertura, 8);
      break;
    case 'N3':
    case 'n3':
    case 'Especialista N3':
      slaResposta = addHours(dataAbertura, 2);
      slaSolucao = addHours(dataAbertura, 24);
      break;
    case 'N1':
    case 'n1':
    case 'Técnico N1':
    default:
      slaResposta = addMinutes(dataAbertura, 30);
      slaSolucao = addHours(dataAbertura, 4);
      break;
  }

  return { slaResposta, slaSolucao };
};
