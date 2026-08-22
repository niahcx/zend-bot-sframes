# Emojis do Zend

Os arquivos em `discord-emojis/upload` sao as imagens dos emojis usados pelo clone.

Use `npm run syncemojis` para enviar esses arquivos como emojis do aplicativo do bot. Isso nao usa os slots de emoji do servidor.

O bot salva os IDs sincronizados em `data/state.json` e troca automaticamente os emojis antigos pelos IDs do aplicativo quando inicia.

Observacao importante: o Discord nao permite usar um arquivo local diretamente como emoji dentro de botoes, selects ou texto inline. Para esses lugares, o arquivo precisa virar emoji do aplicativo ou o bot precisa usar um emoji unicode de fallback.
