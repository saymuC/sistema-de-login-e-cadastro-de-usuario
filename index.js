import readline from 'readline-sync';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcript from 'bcrypt';

const db = await open({
    filename: './banco.db',
    driver: sqlite3.Database,
});

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

Menus();