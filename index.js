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
    'Login', 
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
                case 'login':
                    Login();
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
    inserirUser(nome_resposta, email_resposta, senha_resposta);
    console.log(chalk.green('Usuário cadastrado com sucesso!'))
    Menus();
};

Menus();