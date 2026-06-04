export interface DeputadoResumo {
  id: number
  nome: string
  siglaPartido: string
  siglaUf: string
  idLegislatura: number
  urlFoto: string
  email: string
}

export interface DeputadoDetalhe {
  id: number
  nomeCivil: string
  ultimoStatus: {
    id: number
    uri: string
    nome: string
    siglaPartido: string
    uriPartido: string
    siglaUf: string
    idLegislatura: number
    urlFoto: string
    email: string
    data: string
    nomeEleitoral: string
    gabinete: {
      nome: string
      predio: string
      sala: string
      andar: string
      telefone: string
      email: string
    }
    situacao: string
    condicaoEleitoral: string
    descricaoStatus: string
  }
  cpf: string
  sexo: string
  urlWebsite: string
  redeSocial: string[]
  dataNascimento: string
  dataFalecimento: string
  ufNascimento: string
  municipioNascimento: string
  escolaridade: string
}

export interface Votacao {
  id: string
  uri: string
  data: string
  dataHoraRegistro: string
  siglaOrgao: string
  uriOrgao: string
  uriEvento: string
  proposicaoObjeto: string
  uriProposicaoObjeto: string
  descricao: string
  aprovacao: number
}

export interface VotoDeputado {
  tipoVoto: 'Sim' | 'Não' | 'Abstenção' | 'Obstrução' | 'Artigo 17' | '-'
  dataRegistroVoto: string
  deputado_: {
    id: number
    nome: string
    siglaPartido: string
    siglaUf: string
    urlFoto: string
    uri: string
  }
}

export interface Proposicao {
  id: number
  uri: string
  siglaTipo: string
  codTipo: number
  numero: number
  ano: number
  ementa: string
}

export interface ProposicaoDetalhe {
  id: number
  uri: string
  siglaTipo: string
  codTipo: number
  numero: number
  ano: number
  ementa: string
  dataApresentacao: string
  uriOrgaoNumerador: string
  statusProposicao: {
    uri: string
    sequencia: number
    siglaOrgao: string
    uriOrgao: string
    uriUltimoRelator: string
    regime: string
    descricaoTramitacao: string
    codTipoTramitacao: string
    descricaoSituacao: string
    codSituacao: number
    despacho: string
    url: string
    dataHora: string
    ambito: string
    apreciacao: string
  }
  uriAutores: string
  descricaoTipo: string
  ementaDetalhada: string
  keywords: string
  uriPropPrincipal: string
  uriPropAnterior: string
  uriPropPosterior: string
  urlInteiroTeor: string
  urnFinal: string
  texto: string
  justificativa: string
}

export interface Evento {
  id: number
  uri: string
  dataHoraInicio: string
  dataHoraFim: string
  situacao: string
  descricaoTipo: string
  descricao: string
  localExterno: string
  orgaos: { sigla: string; nome: string }[]
  localCamara: {
    nome: string
    predio: string
    sala: string
    andar: string
  }
  urlRegistro: string
}

export interface Despesa {
  ano: number
  mes: number
  tipoDespesa: string
  codDocumento: number
  tipoDocumento: string
  codTipoDocumento: number
  dataDocumento: string
  numDocumento: string
  valorDocumento: number
  urlDocumento: string
  nomeFornecedor: string
  cnpjCpfFornecedor: string
  valorLiquido: number
  valorGlosa: number
  numRessarcimento: string
  codLote: number
  parcela: number
}

export interface ApiResponse<T> {
  dados: T
  links: { rel: string; href: string }[]
}

export interface Partido {
  id: number
  sigla: string
  nome: string
  uri: string
}
