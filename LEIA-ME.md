# PGB Seguros

Prévia institucional estática para o ChatGPT Sites. A página reúne o catálogo de seguros e planos, a história da PGB, as parcerias, links do blog e os contatos das unidades de Macapá e Belém. A cotação prepara uma mensagem para o visitante revisar e enviar pelo WhatsApp.

## Editar e conferir

- Edite textos, produtos e endereços em `dist/index.html`.
- Ajuste cores e espaçamentos em `dist/style.css`. A logo original e a fonte Montserrat estão em `dist/assets`.
- Os filtros e a janela de cotação ficam em `dist/site.js`. O medalhão tridimensional usa `dist/hero-scene.js` e uma cópia local do Three.js. As transições de rolagem ficam em `dist/section-seams.js`. Os números de WhatsApp aparecem no seletor de unidade e nos links de contato de `dist/index.html`.
- Para conferir a prévia local, execute `py -m http.server 8763 --bind 127.0.0.1 --directory dist` na pasta do projeto e abra `http://127.0.0.1:8763/`.
- Para atualizar a publicação, envie a nova versão do código ao repositório do Site e publique a versão no ChatGPT Sites.

## Referências

- Conteúdo institucional e produtos. [PGB Corretora](https://pgbcorretora.com.br/)
- Referência de movimento. [Tinano](https://tinano-novo-site.rosymap2.chatgpt.site/)
- O manual fornecido orientou as cores, a tipografia, as linhas e o uso da logo. O wallpaper fornecido compõe a prévia de compartilhamento.
- O medalhão de abertura usa a logo original da PGB na face. O relevo dourado e os anéis foram compostos em 3D para o site.
