# Preparar o servidor (Ubuntu 24.04 LTS, VPS Hostinger KVM 1)

Roteiro executado em 21/10/2026 para a Frente 10 (arquitetura e infraestrutura) do Cafélens.
Serve de base para a seção "Preparar o servidor" e para "Recriar do zero" do `DEPLOY.md`.

> Nunca versione o IP do servidor, senhas, chaves privadas nem o `.env`. Abaixo, `<IP_DO_SERVIDOR>`
> e `<CHAVE_PRIVADA>` são só marcadores.

## Ambiente

| Item | Valor observado |
|---|---|
| Provedor / plano | Hostinger, VPS KVM 1 (1 vCPU, 4 GB de RAM, 50 GB NVMe), plano de 1 mês |
| Região | Brasil |
| Sistema | Ubuntu 24.04.5 LTS, kernel 6.8.0-147 |
| Domínio | `coffealab.tech` (API em `api.coffealab.tech`, registro DNS tipo A, TTL 300) |
| Docker | docker-ce 29.9.2, plugin compose 5.6.1 |

Não rode `do-release-upgrade` (o banner oferece o Ubuntu 26.04): o projeto fica no 24.04 LTS.

## 0. Pré-requisitos na máquina do gestor

Chave SSH criada no Windows (PowerShell) e a parte pública cadastrada no painel do VPS:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.ssh" | Out-Null
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\<CHAVE_PRIVADA>" -C "cafelens-vps"
Get-Content "$env:USERPROFILE\.ssh\<CHAVE_PRIVADA>.pub" | Set-Clipboard
```

O arquivo `.pub` é a chave pública (vai para o painel). O arquivo sem `.pub` é a privada e nunca sai
do computador.

## 1. Atualizar o sistema (como root)

```bash
ssh -i "$env:USERPROFILE\.ssh\<CHAVE_PRIVADA>" root@<IP_DO_SERVIDOR>
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get -y upgrade
timedatectl set-timezone America/Sao_Paulo
```

## 2. Usuário `deploy` (como root)

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-deploy
chmod 440 /etc/sudoers.d/90-deploy && visudo -cf /etc/sudoers.d/90-deploy   # deve dizer: parsed OK
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
mkdir -p /opt/cafelens && chown deploy:deploy /opt/cafelens
```

Teste em outro terminal, sem fechar o do root:

```powershell
ssh -i "$env:USERPROFILE\.ssh\<CHAVE_PRIVADA>" deploy@<IP_DO_SERVIDOR>
sudo whoami   # deve responder: root
```

## 3. Atualização final e reinício (como deploy)

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get -y dist-upgrade
sudo reboot
```

Depois de 1 minuto, entre de novo. Confira o fuso: `timedatectl | grep "Time zone"`.
Pacotes "adiados por phasing" (cloud-init, glib, tmux) são normais e chegam depois.

## 4. Swap de 2 GB (o modelo chega a ~2,4 GB de pico em 4 GB de RAM)

```bash
swapon --show   # vazio: criar
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf && sudo sysctl --system > /dev/null
free -h   # deve mostrar: Swap 2.0Gi
```

## 5. Docker (repositório oficial)

```bash
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy
sudo docker run --rm hello-world   # deve imprimir: Hello from Docker!
```

O grupo `docker` só vale no próximo login do `deploy`. Docker no grupo `docker` equivale a acesso de root
ao servidor: só o usuário `deploy` entra nele.

## 6. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

Atenção: portas publicadas pelo Docker passam por cima do `ufw`. O compose do projeto deve publicar
só 80 e 443 (Caddy), e a API fica na rede interna do Docker.

## 7. SSH só por chave

```bash
printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n' | sudo tee /etc/ssh/sshd_config.d/00-cafelens.conf
sudo sshd -t && sudo systemctl reload ssh
sudo sshd -T | grep -E "^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin)"
```

Saída esperada: `permitrootlogin without-password`, `passwordauthentication no`,
`kbdinteractiveauthentication no`. O arquivo se chama `00-...` de propósito: no `sshd`, vale o primeiro
valor lido, e o `50-cloud-init.conf` poderia religar a senha. Antes de fechar a sessão, abra outro
terminal e confirme que o login por chave ainda funciona.

## 8. Verificação final

- [ ] `ssh deploy@<IP_DO_SERVIDOR>` entra só com a chave.
- [ ] `ssh -o PubkeyAuthentication=no deploy@<IP_DO_SERVIDOR>` responde `Permission denied (publickey)`.
- [ ] `nslookup api.coffealab.tech 8.8.8.8` responde o IP do servidor.
- [ ] `free -h` mostra 2,0 GiB de swap; `docker --version` e `docker compose version` respondem.
- [ ] `sudo ufw status` mostra só 22, 80 e 443.

## 9. Recriar do zero (ex.: troca de região do VPS, que reinstala o sistema)

1. Baixar antes o backup do `coffea.db` (reinstalar apaga tudo, inclusive backups e snapshots do painel).
2. Reinstalar o sistema pelo painel e cadastrar a chave pública.
3. Refazer os passos 1 a 8 acima.
4. Atualizar o registro DNS `A` de `api` se o IP mudou.
5. Recopiar os pesos (`scp`), conferir o SHA-256 e subir o compose.
