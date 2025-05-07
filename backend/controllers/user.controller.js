const { Op } = require('sequelize');
const { User, Prefeitura } = require('../models');
const authConfig = require('../config/auth');
const fs = require('fs');
const path = require('path');

/**
 * Listar usuários com suporte a paginação e filtros
 */
const listarUsuarios = async (req, res) => {
  try {
    // Obter parâmetros de paginação e filtros
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const offset = (pagina - 1) * limite;
    
    const termo = req.query.termo || '';
    const tipoPerfil = req.query.tipo_perfil;
    const prefeituraId = req.query.prefeitura_id;
    const status = req.query.status;
    
    // Filtros
    const filtros = {};
    const where = {};
    
    // Filtro por termo de busca (nome, email ou CPF)
    if (termo) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${termo}%` } },
        { email: { [Op.iLike]: `%${termo}%` } },
        { cpf: { [Op.iLike]: `%${termo}%` } }
      ];
    }
    
    // Filtro por tipo de perfil
    if (tipoPerfil) {
      where.tipo_perfil = tipoPerfil;
    }
    
    // Filtro por status (ativo/inativo)
    if (status === 'ativo') {
      where.ativo = true;
    } else if (status === 'inativo') {
      where.ativo = false;
    }
    
    // Filtro por prefeitura
    if (req.userPerfil !== authConfig.roles.SUPER_ADMIN) {
      // Se não for Super Admin, só pode ver usuários da sua prefeitura
      where.prefeitura_id = req.prefeituraId;
    } else if (prefeituraId) {
      // Se for Super Admin e especificou prefeitura, filtra por ela
      where.prefeitura_id = prefeituraId;
    }
    
    // Realizar a consulta com contagem
    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Prefeitura,
          as: 'prefeitura',
          attributes: ['id', 'nome']
        }
      ],
      limit: limite,
      offset: offset,
      order: [['nome', 'ASC']]
    });
    
    // Calcular total de páginas
    const totalPaginas = Math.ceil(count / limite);
    
    // Formatar usuários para retorno
    const usuarios = rows.map(user => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      telefone: user.telefone,
      tipo_perfil: user.tipo_perfil,
      prefeitura: user.prefeitura ? {
        id: user.prefeitura.id,
        nome: user.prefeitura.nome
      } : null,
      ativo: user.ativo,
      ultimo_login: user.ultimo_login,
      foto: user.foto,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
    
    // Retornar resultado
    return res.json({
      usuarios,
      paginacao: {
        total: count,
        pagina,
        limite,
        paginas: totalPaginas
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao listar usuários',
      details: error.message
    });
  }
};

/**
 * Buscar usuário por ID
 */
const buscarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar usuário completo com prefeitura
    const user = await User.findByPk(id, {
      include: [
        {
          model: Prefeitura,
          as: 'prefeitura',
          attributes: ['id', 'nome', 'logo']
        }
      ]
    });
    
    // Verificar se o usuário existe
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar permissão: Super Admin pode ver todos, outros só da mesma prefeitura
    if (req.userPerfil !== authConfig.roles.SUPER_ADMIN && 
        user.prefeitura_id !== req.prefeituraId) {
      return res.status(403).json({
        error: true,
        message: 'Você não tem permissão para visualizar este usuário'
      });
    }
    
    // Formatar dados para retorno
    const userData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      telefone: user.telefone,
      tipo_perfil: user.tipo_perfil,
      prefeitura: user.prefeitura ? {
        id: user.prefeitura.id,
        nome: user.prefeitura.nome,
        logo: user.prefeitura.logo
      } : null,
      ativo: user.ativo,
      ultimo_login: user.ultimo_login,
      foto: user.foto,
      permissoes: user.getAllPermissions(),
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    return res.json(userData);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao buscar usuário',
      details: error.message
    });
  }
};

/**
 * Criar novo usuário
 */
const criarUsuario = async (req, res) => {
  try {
    const { 
      nome, 
      email, 
      cpf, 
      telefone, 
      senha, 
      tipo_perfil,
      prefeitura_id,
      permissoes_adicionais,
      ativo = true
    } = req.body;
    
    // Validar campos obrigatórios
    if (!nome || !email || !cpf || !senha || !tipo_perfil) {
      return res.status(400).json({
        error: true,
        message: 'Campos obrigatórios não informados'
      });
    }
    
    // Verificar se o usuário já existe
    const usuarioExistente = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { cpf: cpf.replace(/\D/g, '') }
        ]
      }
    });
    
    if (usuarioExistente) {
      return res.status(400).json({
        error: true,
        message: 'Já existe um usuário com este email ou CPF'
      });
    }
    
    // Validar tipo de perfil
    if (!Object.values(authConfig.roles).includes(tipo_perfil)) {
      return res.status(400).json({
        error: true,
        message: 'Tipo de perfil inválido'
      });
    }
    
    // Se não for Super Admin, só pode criar usuários para sua prefeitura
    if (req.userPerfil !== authConfig.roles.SUPER_ADMIN) {
      if (!prefeitura_id || prefeitura_id !== req.prefeituraId) {
        return res.status(403).json({
          error: true,
          message: 'Você só pode criar usuários para sua prefeitura'
        });
      }
    } else if (tipo_perfil !== authConfig.roles.SUPER_ADMIN && !prefeitura_id) {
      // Se for Super Admin criando perfis não Super Admin, precisa informar a prefeitura
      return res.status(400).json({
        error: true,
        message: 'Prefeitura é obrigatória para este tipo de perfil'
      });
    }
    
    // Preparar objeto do usuário
    const userData = {
      nome,
      email,
      cpf,
      telefone,
      senha,
      tipo_perfil,
      prefeitura_id: tipo_perfil === authConfig.roles.SUPER_ADMIN ? null : prefeitura_id,
      ativo,
      permissoes_adicionais: permissoes_adicionais || []
    };
    
    // Se tem foto no upload, adicionar caminho
    if (req.file) {
      userData.foto = `/uploads/usuarios/${req.file.filename}`;
    }
    
    // Criar o usuário no banco de dados
    const novoUsuario = await User.create(userData);
    
    // Remover a senha do resultado
    const { senha: _, ...usuarioSemSenha } = novoUsuario.toJSON();
    
    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      usuario: usuarioSemSenha
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao criar usuário',
      details: error.message
    });
  }
};

/**
 * Atualizar usuário
 */
const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nome, 
      email, 
      cpf, 
      telefone, 
      tipo_perfil,
      prefeitura_id,
      permissoes_adicionais
    } = req.body;
    
    // Buscar o usuário
    const user = await User.findByPk(id);
    
    // Verificar se o usuário existe
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar permissão: Super Admin pode editar todos, outros só da mesma prefeitura
    if (req.userPerfil !== authConfig.roles.SUPER_ADMIN && 
        user.prefeitura_id !== req.prefeituraId) {
      return res.status(403).json({
        error: true,
        message: 'Você não tem permissão para editar este usuário'
      });
    }
    
    // Se tentar alterar email ou CPF, verificar se já existem
    if ((email && email !== user.email) || (cpf && cpf !== user.cpf)) {
      const usuarioExistente = await User.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            { email: email || user.email },
            { cpf: (cpf || user.cpf).replace(/\D/g, '') }
          ]
        }
      });
      
      if (usuarioExistente) {
        return res.status(400).json({
          error: true,
          message: 'Já existe um usuário com este email ou CPF'
        });
      }
    }
    
    // Preparar objeto com dados atualizados
    const dadosAtualizados = {};
    
    if (nome) dadosAtualizados.nome = nome;
    if (email) dadosAtualizados.email = email;
    if (cpf) dadosAtualizados.cpf = cpf;
    if (telefone) dadosAtualizados.telefone = telefone;
    
    // Apenas Super Admin pode alterar tipo de perfil e prefeitura
    if (req.userPerfil === authConfig.roles.SUPER_ADMIN) {
      if (tipo_perfil) {
        // Validar tipo de perfil
        if (!Object.values(authConfig.roles).includes(tipo_perfil)) {
          return res.status(400).json({
            error: true,
            message: 'Tipo de perfil inválido'
          });
        }
        
        dadosAtualizados.tipo_perfil = tipo_perfil;
      }
      
      // Se for Super Admin, não pode ter prefeitura
      if (tipo_perfil === authConfig.roles.SUPER_ADMIN) {
        dadosAtualizados.prefeitura_id = null;
      } else if (prefeitura_id) {
        dadosAtualizados.prefeitura_id = prefeitura_id;
      }
    }
    
    // Atualizar permissões adicionais
    if (permissoes_adicionais) {
      dadosAtualizados.permissoes_adicionais = permissoes_adicionais;
    }
    
    // Se tem foto no upload, atualizar caminho e remover a foto antiga
    if (req.file) {
      // Remover foto antiga, se existir
      if (user.foto) {
        const fotoAntiga = path.join(__dirname, '..', user.foto);
        if (fs.existsSync(fotoAntiga)) {
          fs.unlinkSync(fotoAntiga);
        }
      }
      
      dadosAtualizados.foto = `/uploads/usuarios/${req.file.filename}`;
    }
    
    // Atualizar usuário no banco de dados
    await user.update(dadosAtualizados);
    
    // Buscar usuário atualizado com prefeitura
    const usuarioAtualizado = await User.findByPk(id, {
      include: [
        {
          model: Prefeitura,
          as: 'prefeitura',
          attributes: ['id', 'nome', 'logo']
        }
      ]
    });
    
    return res.json({
      message: 'Usuário atualizado com sucesso',
      usuario: usuarioAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao atualizar usuário',
      details: error.message
    });
  }
};

/**
 * Alterar senha de um usuário
 */
const alterarSenha = async (req, res) => {
  try {
    const { id } = req.params;
    const { senha_atual, nova_senha } = req.body;
    
    // Verificar se a nova senha foi informada
    if (!nova_senha || nova_senha.length < 6) {
      return res.status(400).json({
        error: true,
        message: 'A nova senha deve ter pelo menos 6 caracteres'
      });
    }
    
    // Buscar o usuário com a senha
    const user = await User.scope('withPassword').findByPk(id);
    
    // Verificar se o usuário existe
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se é o próprio usuário alterando sua senha ou um admin
    const isSelfUpdate = req.userId === id;
    const isAdmin = req.userPerfil === authConfig.roles.SUPER_ADMIN || 
                    (req.userPerfil === authConfig.roles.ADMIN && user.prefeitura_id === req.prefeituraId);
    
    // Se for o próprio usuário, exigir senha atual
    if (isSelfUpdate) {
      // Verificar se a senha atual foi informada
      if (!senha_atual) {
        return res.status(400).json({
          error: true,
          message: 'A senha atual é obrigatória'
        });
      }
      
      // Verificar se a senha atual está correta
      const senhaCorreta = await user.verificarSenha(senha_atual);
      if (!senhaCorreta) {
        return res.status(400).json({
          error: true,
          message: 'Senha atual incorreta'
        });
      }
    } else if (!isAdmin) {
      // Se não for o próprio usuário nem admin, não tem permissão
      return res.status(403).json({
        error: true,
        message: 'Você não tem permissão para alterar a senha deste usuário'
      });
    }
    
    // Atualizar a senha
    user.senha = nova_senha;
    await user.save();
    
    return res.json({
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao alterar senha',
      details: error.message
    });
  }
};

/**
 * Alterar status (ativar/desativar) de um usuário
 */
const alterarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    // Verificar se o status foi informado
    if (typeof ativo !== 'boolean') {
      return res.status(400).json({
        error: true,
        message: 'Status inválido. Informe true para ativar ou false para desativar'
      });
    }
    
    // Buscar o usuário
    const user = await User.findByPk(id);
    
    // Verificar se o usuário existe
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar permissão: Super Admin pode alterar todos, outros só da mesma prefeitura
    if (req.userPerfil !== authConfig.roles.SUPER_ADMIN && 
        user.prefeitura_id !== req.prefeituraId) {
      return res.status(403).json({
        error: true,
        message: 'Você não tem permissão para alterar o status deste usuário'
      });
    }
    
    // Não permitir desativar o próprio usuário
    if (!ativo && req.userId === id) {
      return res.status(400).json({
        error: true,
        message: 'Você não pode desativar seu próprio usuário'
      });
    }
    
    // Atualizar o status
    await user.update({ ativo });
    
    return res.json({
      message: ativo ? 'Usuário ativado com sucesso' : 'Usuário desativado com sucesso',
      usuario: {
        id: user.id,
        nome: user.nome,
        ativo: user.ativo
      }
    });
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao alterar status do usuário',
      details: error.message
    });
  }
};

/**
 * Remover um usuário
 */
const removerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Não permitir remover o próprio usuário
    if (req.userId === id) {
      return res.status(400).json({
        error: true,
        message: 'Você não pode remover seu próprio usuário'
      });
    }
    
    // Buscar o usuário
    const user = await User.findByPk(id);
    
    // Verificar se o usuário existe
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar permissão: Super Admin pode remover todos, outros só da mesma prefeitura
    if (req.userPerfil !== authConfig.roles.SUPER_ADMIN && 
        user.prefeitura_id !== req.prefeituraId) {
      return res.status(403).json({
        error: true,
        message: 'Você não tem permissão para remover este usuário'
      });
    }
    
    // Remover foto do usuário, se existir
    if (user.foto) {
      const fotoPath = path.join(__dirname, '..', user.foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }
    
    // Remover o usuário
    await user.destroy();
    
    return res.json({
      message: 'Usuário removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro ao remover usuário',
      details: error.message
    });
  }
};

module.exports = {
  listarUsuarios,
  buscarUsuario,
  criarUsuario,
  atualizarUsuario,
  alterarSenha,
  alterarStatus,
  removerUsuario
}; 