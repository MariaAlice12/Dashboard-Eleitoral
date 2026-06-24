// Dado histórico curado manualmente — não há API pública consolidada com
// todos os presidentes do Brasil. Roda com: node prisma/seed-presidentes.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const PRESIDENTES = [
  { ordem: 1, nome: 'Deodoro da Fonseca', partido: null, vice: null, periodoInicio: '1889-11-15', periodoFim: '1891-11-23', condicao: 'golpe', observacoes: 'Proclamou a República; renunciou em 1891 em meio a crise política com o Congresso.' },
  { ordem: 2, nome: 'Floriano Peixoto', partido: null, vice: null, periodoInicio: '1891-11-23', periodoFim: '1894-11-15', condicao: 'vice_assumiu', observacoes: 'Vice de Deodoro da Fonseca; assumiu após a renúncia dele.' },
  { ordem: 3, nome: 'Prudente de Morais', partido: 'PRP', vice: 'Manuel Vitorino', periodoInicio: '1894-11-15', periodoFim: '1898-11-15', condicao: 'eleito', observacoes: 'Primeiro presidente civil eleito por voto direto.' },
  { ordem: 4, nome: 'Campos Sales', partido: 'PRP', vice: 'Rosa e Silva', periodoInicio: '1898-11-15', periodoFim: '1902-11-15', condicao: 'eleito', observacoes: null },
  { ordem: 5, nome: 'Rodrigues Alves', partido: 'PRP', vice: 'Afonso Pena', periodoInicio: '1902-11-15', periodoFim: '1906-11-15', condicao: 'eleito', observacoes: null },
  { ordem: 6, nome: 'Afonso Pena', partido: 'PRM', vice: 'Nilo Peçanha', periodoInicio: '1906-11-15', periodoFim: '1909-06-14', condicao: 'eleito', observacoes: 'Morreu no cargo.' },
  { ordem: 7, nome: 'Nilo Peçanha', partido: null, vice: null, periodoInicio: '1909-06-14', periodoFim: '1910-11-15', condicao: 'vice_assumiu', observacoes: 'Assumiu após a morte de Afonso Pena.' },
  { ordem: 8, nome: 'Hermes da Fonseca', partido: 'PRC', vice: 'Venceslau Brás', periodoInicio: '1910-11-15', periodoFim: '1914-11-15', condicao: 'eleito', observacoes: null },
  { ordem: 9, nome: 'Venceslau Brás', partido: 'PRM', vice: 'Delfim Moreira', periodoInicio: '1914-11-15', periodoFim: '1918-11-15', condicao: 'eleito', observacoes: null },
  { ordem: 10, nome: 'Delfim Moreira', partido: null, vice: null, periodoInicio: '1918-11-15', periodoFim: '1919-07-28', condicao: 'vice_assumiu', observacoes: 'Vice eleito de Rodrigues Alves (2º mandato), que morreu antes da posse; assumiu interinamente.' },
  { ordem: 11, nome: 'Epitácio Pessoa', partido: 'PRP', vice: 'Delfim Moreira', periodoInicio: '1919-07-28', periodoFim: '1922-11-15', condicao: 'eleito', observacoes: 'Eleito em pleito extraordinário convocado após a morte de Rodrigues Alves.' },
  { ordem: 12, nome: 'Artur Bernardes', partido: 'PRM', vice: 'Estácio Coimbra', periodoInicio: '1922-11-15', periodoFim: '1926-11-15', condicao: 'eleito', observacoes: null },
  { ordem: 13, nome: 'Washington Luís', partido: 'PRP', vice: 'Melo Viana', periodoInicio: '1926-11-15', periodoFim: '1930-10-24', condicao: 'eleito', observacoes: 'Deposto pela Revolução de 1930.' },
  { ordem: 14, nome: 'Junta Governativa Provisória', partido: null, vice: null, periodoInicio: '1930-10-24', periodoFim: '1930-11-03', condicao: 'golpe', observacoes: 'Três militares governaram interinamente após a deposição de Washington Luís, até a posse de Getúlio Vargas.' },
  { ordem: 15, nome: 'Getúlio Vargas', partido: null, vice: null, periodoInicio: '1930-11-03', periodoFim: '1945-10-29', condicao: 'golpe', observacoes: 'Chefe do Governo Provisório (1930-1934), presidente constitucional (1934-1937) e ditador do Estado Novo (1937-1945); deposto em 1945.' },
  { ordem: 16, nome: 'José Linhares', partido: null, vice: null, periodoInicio: '1945-10-29', periodoFim: '1946-01-31', condicao: 'interino', observacoes: 'Presidente do STF; assumiu interinamente após a deposição de Vargas.' },
  { ordem: 17, nome: 'Eurico Gaspar Dutra', partido: 'PSD', vice: 'Nereu Ramos', periodoInicio: '1946-01-31', periodoFim: '1951-01-31', condicao: 'eleito', observacoes: null },
  { ordem: 18, nome: 'Getúlio Vargas', partido: 'PTB', vice: 'Café Filho', periodoInicio: '1951-01-31', periodoFim: '1954-08-24', condicao: 'eleito', observacoes: 'Suicidou-se no Palácio do Catete em meio a crise política (2º mandato, agora por eleição direta).' },
  { ordem: 19, nome: 'Café Filho', partido: null, vice: null, periodoInicio: '1954-08-24', periodoFim: '1955-11-08', condicao: 'vice_assumiu', observacoes: 'Assumiu após o suicídio de Vargas.' },
  { ordem: 20, nome: 'Carlos Luz', partido: null, vice: null, periodoInicio: '1955-11-08', periodoFim: '1955-11-11', condicao: 'interino', observacoes: 'Presidente da Câmara; afastado em poucos dias por um contragolpe preventivo que garantiu a posse de Juscelino Kubitschek.' },
  { ordem: 21, nome: 'Nereu Ramos', partido: null, vice: null, periodoInicio: '1955-11-11', periodoFim: '1956-01-31', condicao: 'interino', observacoes: 'Presidente do Senado; governou interinamente até a posse de JK.' },
  { ordem: 22, nome: 'Juscelino Kubitschek', partido: 'PSD', vice: 'João Goulart', periodoInicio: '1956-01-31', periodoFim: '1961-01-31', condicao: 'eleito', observacoes: null },
  { ordem: 23, nome: 'Jânio Quadros', partido: 'PTN', vice: 'João Goulart', periodoInicio: '1961-01-31', periodoFim: '1961-08-25', condicao: 'eleito', observacoes: 'Renunciou após sete meses de mandato.' },
  { ordem: 24, nome: 'Ranieri Mazzilli', partido: null, vice: null, periodoInicio: '1961-08-25', periodoFim: '1961-09-07', condicao: 'interino', observacoes: 'Presidente da Câmara; assumiu interinamente durante a Crise da Legalidade.' },
  { ordem: 25, nome: 'João Goulart', partido: 'PTB', vice: null, periodoInicio: '1961-09-07', periodoFim: '1964-04-01', condicao: 'vice_assumiu', observacoes: 'Regime parlamentarista entre 1961 e 1963; deposto pelo golpe militar de 1964.' },
  { ordem: 26, nome: 'Ranieri Mazzilli', partido: null, vice: null, periodoInicio: '1964-04-02', periodoFim: '1964-04-15', condicao: 'interino', observacoes: '2º período interino, logo após o golpe de 1964, até a eleição indireta de Castelo Branco.' },
  { ordem: 27, nome: 'Castelo Branco', partido: null, vice: 'José Maria Alkmin', periodoInicio: '1964-04-15', periodoFim: '1967-03-15', condicao: 'eleito_indireto', observacoes: 'Primeiro presidente do regime militar (1964-1985).' },
  { ordem: 28, nome: 'Costa e Silva', partido: null, vice: 'Pedro Aleixo', periodoInicio: '1967-03-15', periodoFim: '1969-08-31', condicao: 'eleito_indireto', observacoes: 'Editou o AI-5; afastado por motivo de saúde.' },
  { ordem: 29, nome: 'Junta Militar de 1969', partido: null, vice: null, periodoInicio: '1969-08-31', periodoFim: '1969-10-30', condicao: 'golpe', observacoes: 'Ministros militares Aurélio de Lyra Tavares, Augusto Rademaker e Márcio de Sousa e Melo governaram interinamente.' },
  { ordem: 30, nome: 'Emílio Garrastazu Médici', partido: null, vice: 'Augusto Rademaker', periodoInicio: '1969-10-30', periodoFim: '1974-03-15', condicao: 'eleito_indireto', observacoes: 'Período mais repressivo da ditadura, conhecido como "anos de chumbo".' },
  { ordem: 31, nome: 'Ernesto Geisel', partido: null, vice: 'Adalberto Pereira dos Santos', periodoInicio: '1974-03-15', periodoFim: '1979-03-15', condicao: 'eleito_indireto', observacoes: 'Iniciou a "distensão" do regime militar.' },
  { ordem: 32, nome: 'João Figueiredo', partido: null, vice: 'Aureliano Chaves', periodoInicio: '1979-03-15', periodoFim: '1985-03-15', condicao: 'eleito_indireto', observacoes: 'Último presidente do regime militar; conduziu a abertura política.' },
  { ordem: 33, nome: 'José Sarney', partido: 'PMDB', vice: null, periodoInicio: '1985-03-15', periodoFim: '1990-03-15', condicao: 'vice_assumiu', observacoes: 'Vice eleito de Tancredo Neves, que morreu antes de tomar posse; primeiro governo civil após a ditadura.' },
  { ordem: 34, nome: 'Fernando Collor', partido: 'PRN', vice: 'Itamar Franco', periodoInicio: '1990-03-15', periodoFim: '1992-12-29', condicao: 'eleito', observacoes: 'Primeiro presidente eleito por voto direto desde 1960; renunciou durante o processo de impeachment.' },
  { ordem: 35, nome: 'Itamar Franco', partido: 'PMDB', vice: null, periodoInicio: '1992-12-29', periodoFim: '1995-01-01', condicao: 'vice_assumiu', observacoes: 'Assumiu após a renúncia de Collor.' },
  { ordem: 36, nome: 'Fernando Henrique Cardoso', partido: 'PSDB', vice: 'Marco Maciel', periodoInicio: '1995-01-01', periodoFim: '2003-01-01', condicao: 'eleito', observacoes: 'Reeleito em 1998.' },
  { ordem: 37, nome: 'Luiz Inácio Lula da Silva', partido: 'PT', vice: 'José Alencar', periodoInicio: '2003-01-01', periodoFim: '2011-01-01', condicao: 'eleito', observacoes: 'Reeleito em 2006.' },
  { ordem: 38, nome: 'Dilma Rousseff', partido: 'PT', vice: 'Michel Temer', periodoInicio: '2011-01-01', periodoFim: '2016-08-31', condicao: 'eleito', observacoes: 'Primeira mulher eleita presidente; reeleita em 2014; sofreu impeachment e foi afastada definitivamente em 31/08/2016.' },
  { ordem: 39, nome: 'Michel Temer', partido: 'MDB', vice: null, periodoInicio: '2016-08-31', periodoFim: '2019-01-01', condicao: 'vice_assumiu', observacoes: 'Assumiu após o impeachment de Dilma Rousseff.' },
  { ordem: 40, nome: 'Jair Bolsonaro', partido: 'PSL', vice: 'Hamilton Mourão', periodoInicio: '2019-01-01', periodoFim: '2023-01-01', condicao: 'eleito', observacoes: 'Deixou o PSL em 2019 e ficou sem partido boa parte do mandato.' },
  { ordem: 41, nome: 'Luiz Inácio Lula da Silva', partido: 'PT', vice: 'Geraldo Alckmin', periodoInicio: '2023-01-01', periodoFim: null, condicao: 'eleito', observacoes: 'Mandato em curso.' },
]

async function main() {
  await prisma.presidente.deleteMany()
  await prisma.presidente.createMany({
    data: PRESIDENTES.map((p) => ({
      ...p,
      periodoInicio: new Date(p.periodoInicio),
      periodoFim: p.periodoFim ? new Date(p.periodoFim) : null,
    })),
  })
  console.log(`Seed concluído: ${PRESIDENTES.length} presidentes inseridos.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
