# Como instalar e rodar o Redis no Windows

Como você não possui o Docker ou uma distribuição Linux (WSL) ativa configurada, aqui estão as duas melhores opções para rodar o Redis na sua máquina:

## Opção 1: Memurai (Mais Fácil e Nativo)
O Memurai é a forma mais recomendada de rodar Redis nativamente no Windows hoje em dia.

1.  Acesse: **[https://www.memurai.com/get-memurai](https://www.memurai.com/get-memurai)**
2.  Baixe a versão **Developer Edition** (Gratuita).
3.  Execute o instalador.
4.  Durante a instalação, ele vai perguntar a porta (mantenha `6379`) e se deve iniciar como serviço. **Diga que sim**.
5.  Pronto! O Redis já estará rodando em segundo plano.

## Opção 2: WSL (Subsistema Linux)
Se você pretende trabalhar profissionalmente com desenvolvimento, recomendo instalar o WSL.

1.  Abra o **PowerShell** como Administrador.
2.  Execute: `wsl --install`
3.  Reinicie o computador quando solicitado.
4.  Após reiniciar, abrirá uma janela do Ubuntu. Configure seu usuário e senha.
5.  No terminal do Ubuntu, digite:
    ```bash
    sudo apt update
    sudo apt install redis-server
    sudo service redis-server start
    ```

## Testando
Após instalar (por qualquer método), abra seu terminal (PowerShell ou CMD) e digite, se tiver o comando instalado, ou apenas tente rodar sua aplicação:

```powershell
npm start
```

Se a aplicação conectar sem erros de "ECONNREFUSED", o Redis está funcionando!
