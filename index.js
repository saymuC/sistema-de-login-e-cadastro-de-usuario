import readlineS from 'readline-sync';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcript from 'bcrypt';
import readline from 'readline';
import { stdin as input, stdout as output } from 'node:process';

const db = await open({
    filename: './banco.db',
    driver: sqlite3.Database,
});
const saltRounds = 10; //bcrypt
async function criartagbelaSeNaoExistir() {
   await db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          senha TEXT NOT NULL
        )`
    );      
};
criartagbelaSeNaoExistir();

async function inserirUser(nome, email, senha) {
    const emailRepetido = await db.get(
        `SELECT * FROM usuarios WHERE email = ?`, [email]
    );

    if (emailRepetido) {
        console.log(chalk.red('Já existe um usuário cadastrado com este email. Por favor tente outro.'));
        return;
    }

    await db.run(
        `INSERT INTO usuarios (nome, email, senha)
         VALUES (?, ?, ?)`,
        [nome, email, senha]
        );
}


let MENU = [
    'Cadastrar novo usuário',
    'Listar usuários cadastrados',
    'Remover usuário',
    'Sair'
];

function Menus() {
    inquirer
        .prompt([
            {
                name: 'menu',
                type: 'list',
                message: 'Escolha uma das opções abaixo: ',
                choices: MENU,
            }
        ])
        .then((anwser) => {
            switch(anwser.menu) { 
                case 'Cadastrar novo usuário':
                    cadastrarUser();
                    break;
                case 'Listar usuários cadastrados':
                    listarUser();
                    break;
                case 'Remover usuário':
                    removerUser();
                    break;
                case 'Sair':
                    console.log(chalk.red('Saindo...'))
                    process.exit(0);
                    break;
                default:
                    console.log('Opção inválida');
                    Menus();
                }
        });
};

async function Login() {
    console.log(chalk.blueBright('===Login==='));
    const dados = await db.all(`SELECT email, senha FROM usuarios`);
    const email_login = readlineS.question('Email: ');
    if (email_login === '') {
        console.log(chalk.red('O email não pode estar vázio!'));
        return;
    } 
    if (email_login === 'admin') {
        console.log(chalk.green('iniciando a sessão de admin!'));
        return Menus();
    }
    const senha_login = readlineS.question('Senha: ');
    if (senha_login === '') {
        console.log(chalk.red('A senha não pode estar vázio!'));
        return;
    }
    const senha_hash = dados.find((dado) => dado.email === email_login).senha;
    const senha_correta = await bcript.compare(senha_login, senha_hash);
    const veriicar_login = dados.find((dado) => dado.email === email_login && dado.senha === senha_hash);
    if (veriicar_login) {
        console.log(chalk.green('Login realizado com sucesso!'));
        Menus();
    } else {
        console.log(chalk.red('Email ou senha incorretos!'));
        Login();
    }
    
}

async function cadastrarUser() {
    console.log(chalk.blueBright('===Cadastrar usuário==='));
    const nome_resposta = readlineS.question('Qual o nome do usuário? ').trim();
    if (nome_resposta === '') {
        console.log(chalk.red('O nome não pode estar vazio!'));
        return Menus();
    }
    const email_resposta = readlineS.questionEMail('Qual o email do usuario? ');
    const senha_resposta = readlineS.question('Qual a senha do usuário? ')
    const hash = await bcript.hash(senha_resposta, saltRounds);
    inserirUser(nome_resposta, email_resposta, hash);
    console.log(chalk.green('Usuário cadastrado com sucesso!'))
    Menus();
};

async function listarUser() {
    console.log(chalk.blueBright('====Listar Usuarios==='));
    const dados = await db.all(`SELECT * FROM usuarios`);
    if (dados.length === 0) {
        console.log(chalk.red('Não há nenhuma informação guardad no banco de dados!'));
        return Menus();
    } else {
        console.table(dados);
        return Menus();
    }
}

async function removerUser() {
    console.log(chalk.blueBright('===Remover Usuario==='));
    const dados = await db.all(`SELECT email FROM usuarios`);
    const mapa = dados.map(row => ({
        name: row.email,
        value: row.email
    }));
    const resposta = await inquirer.prompt([
        {
            name: 'email',
            type: 'list',
            message: 'Qual o email do usuário que deseja remover?',
            choices: mapa,
        }
    ]);
    const email = resposta.email;
    const usuario = await db.get(`SELECT * FROM usuarios WHERE email = ?`, [email]);
    if (!usuario) {
        console.log(chalk.red('Usuário não encontrado!'));
        return Menus();
    }
    await db.run(`DELETE FROM usuarios WHERE email = ?`, [email]);
    console.log(chalk.green('Usuário removido com sucesso!'));
    const resposta2 = await inquirer.prompt([
        {
            name: 'confirmar',
            type: 'confirm',
            message: 'Deseja remover outro usuário?',
            default: false,
        }
    ]);
    if (resposta2.confirmar) {
        return removerUser();
    } else {
        return Menus();
    }
}

Login();