import { tratarModalAutomacoes } from '../automacoes/interacoes-automacoes.js';
import { tratarModalOutrasAutomacoes } from '../automacoes/interacoes-outras-automacoes.js';
import { notificarRestock } from '../automacoes/servico-automacoes.js';
import { salvarAuthConfigNoFirebase, listarVerificadosFirebase, salvarTokensFirebase } from '../infraestrutura/firebase-auth.js';
import { TOKEN } from '../configuracoes/ambiente.js';

export function criarHandlerModais(ctx) {
  const {
    ActionRowBuilder,
    ButtonStyle,
    CART_EDITABLE_STATUSES,
    EMOJI,
    EmbedBuilder,
    TextInputStyle,
    antiFakePanel,
    automationFeaturePanel,
    authPanel,
    availableStock,
    badgesPanel,
    button,
    cartAmounts,
    cartField,
    cartPayload,
    cartProduct,
    channelSelectRow,
    clampCartQuantity,
    conditionsPanel,
    couponsPanel,
    customDetailPanel,
    draftProductPanel,
    embed,
    fieldPanel,
    fieldsPanel,
    findCartCoupon,
    finishGiveaway,
    gatewayPaymentPanel,
    getCart,
    getField,
    getProduct,
    giveawayChannelPanel,
    giveawayDetailPanel,
    giveawayDurationPanel,
    giveawayManagePanel,
    giveawayMessagePayload,
    id,
    isCartAdmin,
    isCartOwner,
    linkButton,
    mainPanel,
    manualPaymentPanel,
    modal,
    money,
    moveBalance,
    oauthConfigPanel,
    oauthPanel,
    parseDuration,
    parseHex,
    parsePrice,
    positionPanel,
    productPanel,
    protectDetailPanel,
    protectSelfBotPanel,
    refreshCartMessage,
    repostPanel,
    rolesConfigPanel,
    rolesFieldPanel,
    sendApprovalLog,
    sendOrUpdate,
    stockPanel,
    storeCouponsPanel,
    storeOauthPanel,
    syncSaleMessage,
    tempRolePanel,
    textInput,
    ticketFunctionDetailPanel,
    ticketFunctionsPanel,
    ticketHoursPanel,
    ticketPanel,
    userDraft,
    welcomePanel,
  } = ctx;

  return async function handleModal(interaction, gs) {
  const [, action, a, b, c] = interaction.customId.split(':');
  const guild = interaction.guild;
  const product = getProduct(gs, a);
  const field = getField(product, b);
  const get = (name) => interaction.fields.getTextInputValue(name)?.trim();

  if (await tratarModalAutomacoes(interaction, gs, action, a, b, get)) return;
  if (await tratarModalOutrasAutomacoes(interaction, gs, action, a, b, get)) return;

  switch (action) {
    case 'modal-cart-quantity': {
      const cart = getCart(gs, a);
      if (!cart) return interaction.reply({ content: 'Carrinho não encontrado.', ephemeral: true });
      if (!isCartOwner(interaction, cart) && !isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Este carrinho não pertence a você.', ephemeral: true });
      if (!CART_EDITABLE_STATUSES.has(cart.status)) return interaction.reply({ content: 'Este carrinho não pode mais ser editado.', ephemeral: true });
      const quantity = Math.floor(Number(get('quantity')));
      const fieldRef = cartField(gs, cart);
      const stock = availableStock(fieldRef);
      if (!Number.isFinite(quantity) || quantity < 1) return interaction.reply({ content: `${EMOJI.no} Quantidade inválida.`, ephemeral: true });
      if (Number.isFinite(stock) && quantity > stock) return interaction.reply({ content: `${EMOJI.no} Ops... a quantidade solicitada ultrapassa o estoque disponível.`, ephemeral: true });
      const limits = clampCartQuantity({ ...cart, quantity }, fieldRef);
      cart.quantity = Math.max(limits.min, Math.min(quantity, limits.max));
      cart.updatedAt = Date.now();
      cartAmounts(gs, cart);
      await refreshCartMessage(guild, gs, cart);
      return interaction.reply({ content: `${EMOJI.yesgenesis} | Quantidade alterada para \`${cart.quantity}\`.`, ephemeral: true });
    }
    case 'modal-cart-coupon': {
      const cart = getCart(gs, a);
      if (!cart) return interaction.reply({ content: 'Carrinho não encontrado.', ephemeral: true });
      if (!isCartOwner(interaction, cart) && !isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Este carrinho não pertence a você.', ephemeral: true });
      if (!CART_EDITABLE_STATUSES.has(cart.status)) return interaction.reply({ content: 'Este carrinho não pode mais ser editado.', ephemeral: true });
      const cartProductRef = cartProduct(gs, cart);
      const coupon = findCartCoupon(cartProductRef, get('code'));
      if (!coupon) return interaction.reply({ content: `${EMOJI.no} Cupom inválido para este produto.`, ephemeral: true });
      if (coupon.quantity && Number(coupon.uses || 0) >= Number(coupon.quantity)) return interaction.reply({ content: `${EMOJI.no} Este cupom atingiu o limite de usos.`, ephemeral: true });
      cart.couponCode = coupon.code;
      cart.updatedAt = Date.now();
      cartAmounts(gs, cart);
      await refreshCartMessage(guild, gs, cart);
      return interaction.reply({ content: `${EMOJI.yesgenesis} | Cupom \`${coupon.code}\` aplicado.`, ephemeral: true });
    }
    case 'modal-cart-proof': {
      const cart = getCart(gs, a);
      if (!cart) return interaction.reply({ content: 'Carrinho não encontrado.', ephemeral: true });
      if (!isCartOwner(interaction, cart) && !isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Este carrinho não pertence a você.', ephemeral: true });
      cart.proof = get('proof');
      cart.paymentMethod ||= 'Pagamento Manual';
      cart.status = 'AWAITING_APPROVAL';
      cart.updatedAt = Date.now();
      cartAmounts(gs, cart);
      await refreshCartMessage(guild, gs, cart, {
        embeds: [embed(`${EMOJI.loading} Comprovante enviado • ${cart.publicId}`, 'A equipe recebeu o comprovante e precisa confirmar o pagamento para iniciar a entrega.', guild, 'Aguardando aprovação').setColor(0xf59e0b)],
        components: [new ActionRowBuilder().addComponents(button(id('cart-cancel', cart.id), 'Cancelar', ButtonStyle.Danger, EMOJI.redTrash))],
      });
      await sendApprovalLog(guild, gs, cart);
      return interaction.reply({ content: `${EMOJI.yesgenesis} | Comprovante enviado. Aguarde a aprovação da equipe.`, ephemeral: true });
    }
    case 'modal-product-name': {
      const draft = { name: get('name'), description: '', autoDelivery: true, icon: '', banner: '' };
      userDraft(interaction.user.id).product = draft;
      return sendOrUpdate(interaction, draftProductPanel(guild, draft));
    }
    case 'modal-draft-desc': {
      const draft = userDraft(interaction.user.id).product;
      draft.description = get('description');
      return sendOrUpdate(interaction, draftProductPanel(guild, draft));
    }
    case 'modal-draft-banner': {
      const draft = userDraft(interaction.user.id).product;
      draft.banner = get('url');
      return sendOrUpdate(interaction, draftProductPanel(guild, draft));
    }
    case 'modal-draft-icon': {
      const draft = userDraft(interaction.user.id).product;
      draft.icon = get('url');
      return sendOrUpdate(interaction, draftProductPanel(guild, draft));
    }
    case 'modal-product-edit':
      product.name = get('name');
      product.description = get('description');
      product.autoDelivery = /^s/i.test(get('autoDelivery'));
      product.icon = get('icon');
      product.banner = get('banner');
      await syncSaleMessage(guild, product);
      return sendOrUpdate(interaction, productPanel(guild, product));
    case 'modal-field-new':
      product.fields.push({
        id: crypto.randomUUID(),
        name: get('name'),
        description: get('description'),
        price: parsePrice(get('price')),
        stock: [],
        ghostStock: null,
        infinite: { enabled: false, text: '' },
        instructions: { enabled: false, description: '' },
      });
      await syncSaleMessage(guild, product);
      return sendOrUpdate(interaction, fieldsPanel(guild, product));
    case 'modal-field-edit':
      field.name = get('name');
      field.price = parsePrice(get('price'));
      field.description = get('description');
      await syncSaleMessage(guild, product);
      return sendOrUpdate(interaction, fieldPanel(guild, product, field));
    case 'modal-role-id':
      if (c === 'add') field.addRole = get('roleId');
      else field.removeRole = get('roleId');
      return sendOrUpdate(interaction, rolesFieldPanel(guild, product, field));
    case 'modal-cond-role':
      field.requiredRole = get('roleId');
      return sendOrUpdate(interaction, conditionsPanel(guild, product, field));
    case 'modal-cond-min':
      field.minQty = Number(get('value')) || 0;
      return sendOrUpdate(interaction, conditionsPanel(guild, product, field));
    case 'modal-cond-max':
      field.maxQty = Number(get('value')) || 0;
      return sendOrUpdate(interaction, conditionsPanel(guild, product, field));
    case 'modal-stock-add': {
      const items = get('stock').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      if (/^s/i.test(get('shuffle'))) {
        for (let i = items.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }
      }
      userDraft(interaction.user.id).stockAdd = { productId: product.id, fieldId: field.id, items };
      return sendOrUpdate(interaction, {
        embeds: [
          embed(
            `Total de ${items.length} itens detectados`,
            [
              `Cada item será adicionado como um produto no estoque de \`${field.name}\`, exemplo:`,
              `\`${items.slice(0, 3).map((item, i) => `${i + 1}・${item}`).join(' ')}\``,
              'Esse valor será entregue como **uma** unidade para o cliente.',
              `**Deseja adicionar o valor de \`${items.length}\` itens ao estoque de \`${field.name}\`?**`,
              ':infogenesiss: Caso deseje adicionar esse valor como somente um item, adicione uma vírgula no delimitador.',
            ].join('\n'),
            guild,
          ),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            button(id('stock-confirm', product.id, field.id), 'Sim', ButtonStyle.Success, '📤'),
            button(id('stock-delimiter', product.id, field.id), 'Definir delimitador', ButtonStyle.Secondary, '🧩'),
            button(id('stock', product.id, field.id), 'Cancelar', ButtonStyle.Danger, EMOJI.left),
          ),
        ],
      });
    }
    case 'modal-stock-delimiter': {
      const draft = userDraft(interaction.user.id).stockAdd;
      const delimiter = get('delimiter') || ',';
      draft.items = draft.items.join('\n').split(delimiter).map((x) => x.trim()).filter(Boolean);
      return interaction.reply({ content: `Delimitador definido. ${draft.items.length} itens detectados.`, ephemeral: true });
    }
    case 'modal-stock-ghost':
      field.ghostStock = { quantity: Number(get('quantity')) || 0, value: get('value') };
      field.lastRestock = Date.now();
      await syncSaleMessage(guild, product);
      await notificarRestock(guild, gs, product, field, field.ghostStock.quantity);
      return sendOrUpdate(interaction, stockPanel(guild, product, field));
    case 'modal-stock-infinite':
      field.infinite = { enabled: true, text: get('text') };
      field.lastRestock = Date.now();
      await syncSaleMessage(guild, product);
      await notificarRestock(guild, gs, product, field, 'Estoque infinito');
      return sendOrUpdate(interaction, stockPanel(guild, product, field));
    case 'modal-instructions':
      field.instructions = { enabled: /^s/i.test(get('enabled')), description: get('description') };
      return sendOrUpdate(interaction, fieldPanel(guild, product, field));
    case 'modal-coupon-new': {
      const coupon = {
        id: crypto.randomUUID(),
        code: get('code').toUpperCase(),
        discount: Number(get('discount')) || 0,
        validity: get('validity'),
        quantity: null,
        maxUses: null,
        uses: 0,
        conditions: [],
      };
      product.coupons.push(coupon);
      return sendOrUpdate(interaction, couponsPanel(guild, product));
    }
    case 'modal-coupon-advanced': {
      const coupon = product.coupons.find((item) => item.id === b);
      coupon.maxUses = get('maxUses') || null;
      coupon.quantity = get('quantity') || null;
      coupon.conditions = [];
      if (get('requiredRole')) coupon.conditions.push(`Cargo necessário <@&${get('requiredRole')}>`);
      if (get('minQty')) coupon.conditions.push(`Comprar no mínimo ${get('minQty')} unidades`);
      if (get('maxQty')) coupon.conditions.push(`Comprar no máximo ${get('maxQty')} unidades`);
      return sendOrUpdate(interaction, couponsPanel(guild, product));
    }
    case 'modal-sell':
      product.saleEmoji = get('emoji') || EMOJI.carrinhoZend || '🛒';
      product.saleLabel = get('label') || 'Comprar';
      product.saleStyle = get('style') || 'Verde';
      product.saleColor = get('color') || '#FFFFFF';
      return sendOrUpdate(interaction, { content: 'Selecione o canal onde quer postar a mensagem.', components: [channelSelectRow(id('sell-channel', product.id))] });
    case 'modal-welcome-message':
      gs.welcome.message = get('message');
      return sendOrUpdate(interaction, welcomePanel(guild, gs));
    case 'modal-welcome-autodelete':
      gs.welcome.autoDeleteSeconds = Number(get('seconds')) || 0;
      return sendOrUpdate(interaction, welcomePanel(guild, gs));
    case 'modal-welcome-image':
      gs.welcome.image = get('url');
      return sendOrUpdate(interaction, welcomePanel(guild, gs));
    case 'modal-welcome-color':
      gs.welcome.color = get('color');
      return sendOrUpdate(interaction, welcomePanel(guild, gs));
    case 'modal-welcome-title':
      gs.welcome.title = get('title');
      return sendOrUpdate(interaction, welcomePanel(guild, gs));
    case 'modal-repost-time':
      gs.automations.repost.time = get('time');
      return sendOrUpdate(interaction, repostPanel(guild, gs));
    case 'modal-ticket-appearance':
      gs.ticket.title = get('title');
      gs.ticket.description = get('description');
      gs.ticket.banner = get('banner');
      gs.ticket.color = get('color') || '#FFFFFF';
      return sendOrUpdate(interaction, ticketPanel(guild, gs));
    case 'modal-ticket-function':
      gs.ticket.functions.push({
        id: crypto.randomUUID(),
        name: get('name'),
        preDescription: get('preDescription'),
        description: get('description'),
        banner: get('banner'),
        emoji: get('emoji') || '📋',
        purchaseDetection: true,
      });
      return sendOrUpdate(interaction, ticketFunctionsPanel(guild, gs));
    case 'modal-ticket-function-edit': {
      const fn = gs.ticket.functions.find((item) => item.id === a);
      if (!fn) return sendOrUpdate(interaction, ticketFunctionsPanel(guild, gs));
      fn.name = get('name');
      fn.preDescription = get('preDescription');
      fn.description = get('description');
      fn.banner = get('banner');
      fn.emoji = get('emoji') || '📋';
      return sendOrUpdate(interaction, ticketFunctionDetailPanel(guild, fn));
    }
    case 'modal-giveaway-new':
      userDraft(interaction.user.id).giveaway = {
        title: get('title'),
        description: get('description'),
        winners: Math.max(1, Math.min(20, Number(get('winners')) || 1)),
        creatorId: interaction.user.id,
        durationMs: null,
        channelId: null,
        allowedRoles: [],
        blockedRoles: [],
        extraEntries: {},
      };
      return sendOrUpdate(interaction, giveawayDurationPanel(guild, userDraft(interaction.user.id).giveaway));
    case 'modal-giveaway-duration': {
      const duration = parseDuration(get('duration'));
      if (duration < 60_000 || duration > 30 * 24 * 60 * 60 * 1000) {
        return interaction.reply({ content: 'Use um tempo entre `1m` e `30d`.', ephemeral: true });
      }
      const draft = userDraft(interaction.user.id).giveaway;
      draft.durationMs = duration;
      return sendOrUpdate(interaction, giveawayChannelPanel(guild, draft));
    }
    case 'modal-giveaway-force': {
      const giveaway = gs.giveaways.find((item) => item.id === a);
      if (!giveaway || get('confirmation').toUpperCase() !== 'SIM') return interaction.reply({ content: 'Finalização cancelada.', ephemeral: true });
      await finishGiveaway(guild, giveaway);
      return sendOrUpdate(interaction, giveawayManagePanel(guild, gs));
    }
    case 'modal-giveaway-add-time': {
      const giveaway = gs.giveaways.find((item) => item.id === a);
      const duration = parseDuration(get('duration'));
      if (!giveaway || duration < 60_000 || duration > 30 * 24 * 60 * 60 * 1000) return interaction.reply({ content: 'Use um tempo entre `1m` e `30d`.', ephemeral: true });
      giveaway.endAt = Date.now() + duration;
      const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
      const message = channel?.isTextBased() ? await channel.messages.fetch(giveaway.messageId).catch(() => null) : null;
      if (message) await message.edit(giveawayMessagePayload(giveaway)).catch(() => null);
      return sendOrUpdate(interaction, giveawayDetailPanel(guild, giveaway));
    }
    case 'modal-pay-manual':
      gs.payments.manual.keyType = get('keyType');
      gs.payments.manual.pixKey = get('pixKey');
      gs.payments.manual.message = get('message');
      gs.payments.manual.configured = true;
      return sendOrUpdate(interaction, manualPaymentPanel(guild, gs));
    case 'modal-gateway': {
      const item = gs.payments[a];
      if (a === 'efi') {
        item.clientId = get('clientId');
        item.clientSecret = get('clientSecret');
        item.pixKey = get('pixKey');
        item.certificate = get('certificate');
        item.configured = Boolean(item.clientId && item.clientSecret && item.pixKey);
      } else {
        item.accessToken = get('accessToken');
        item.publicKey = get('publicKey');
        item.configured = Boolean(item.accessToken);
      }
      return sendOrUpdate(interaction, gatewayPaymentPanel(guild, gs, a));
    }
    case 'modal-oauth-register':
      gs.cloud.linked = true;
      gs.cloud.syncedMembers = 0;
      return sendOrUpdate(interaction, oauthPanel(guild, gs));
    case 'modal-oauth-server-id':
      gs.cloud.serverId = get('serverId');
      return sendOrUpdate(interaction, oauthConfigPanel(guild, gs));
    case 'modal-oauth-webhook':
      gs.cloud.webhookUrl = get('webhookUrl');
      return sendOrUpdate(interaction, oauthConfigPanel(guild, gs));
    case 'modal-oauth-recover': {
      const serverId = get('serverId');
      const limit = Number(get('limit')) || gs.cloud.syncedMembers || 0;
      return interaction.reply({ content: `Recuperação solicitada para o servidor \`${serverId}\`, limitada a \`${limit || 'todos'}\` membros sincronizados.`, ephemeral: true });
    }
    case 'modal-store-oauth-text':
      gs.storeOauth.text = get('text');
      return sendOrUpdate(interaction, storeOauthPanel(guild, gs));
    case 'modal-position-role':
      gs.positions[Number(a) - 1].roleId = get('roleId');
      return sendOrUpdate(interaction, positionPanel(guild, gs, Number(a)));
    case 'modal-balance-action': {
      const userId = get('userId');
      const fakeUser = { id: userId, username: userId, tag: userId };
      const account = moveBalance(gs, fakeUser, parsePrice(get('amount')), a, get('reason') || 'Movimentação manual');
      return interaction.reply({ content: `Saldo de <@${userId}> atualizado para \`${money(account.balance)}\`.`, ephemeral: true });
    }
    case 'modal-balance-get': {
      const userId = get('userId');
      const account = gs.balance.users[userId];
      return interaction.reply({ content: account ? `<@${userId}> possui \`${money(account.balance)}\`.` : 'Usuário sem saldo registrado.', ephemeral: true });
    }
    case 'modal-balance-recharge':
      gs.stockRequests.push({ type: 'balance', userId: interaction.user.id, amount: parsePrice(get('amount')), note: get('note'), at: Date.now() });
      return interaction.reply({ content: `Solicitação de recarga de \`${money(parsePrice(get('amount')))}\` registrada.`, ephemeral: true });
    case 'modal-mass-coupon-create': {
      const code = get('code').toUpperCase();
      const discount = Number(get('discount')) || 0;
      for (const item of gs.products) {
        item.coupons ??= [];
        item.coupons.push({ id: crypto.randomUUID(), code, discount, validity: get('validity'), quantity: null, maxUses: null, uses: 0, conditions: ['Cupom criado em massa'] });
      }
      return sendOrUpdate(interaction, storeCouponsPanel(guild, gs));
    }
    case 'modal-mass-coupon-remove': {
      const code = get('code').toUpperCase();
      for (const item of gs.products) item.coupons = (item.coupons || []).filter((coupon) => coupon.code !== code);
      return sendOrUpdate(interaction, storeCouponsPanel(guild, gs));
    }
    case 'modal-badge-new':
      gs.badges.push({ id: crypto.randomUUID(), name: get('name'), amount: parsePrice(get('amount')), emoji: get('emoji'), roleId: get('roleId') });
      return sendOrUpdate(interaction, badgesPanel(guild, gs));
    case 'modal-temp-role-new':
      gs.tempRoles.push({ id: crypto.randomUUID(), productName: get('productName'), roleId: get('roleId'), days: Number(get('days')) || 1 });
      return sendOrUpdate(interaction, tempRolePanel(guild, gs));
    case 'modal-temp-role-config':
      gs.tempRoleSettings.removeExpired = /^s/i.test(get('removeExpired'));
      gs.tempRoleSettings.notifyDm = /^s/i.test(get('notifyDm'));
      return sendOrUpdate(interaction, tempRolePanel(guild, gs));
    case 'modal-role-config':
      gs.roles[a] = get('roleId');
      return sendOrUpdate(interaction, rolesConfigPanel(guild, gs));
    case 'modal-ticket-hours':
      gs.ticket.hoursMode = get('mode');
      gs.ticket.openAt = get('openAt');
      gs.ticket.closeAt = get('closeAt');
      return sendOrUpdate(interaction, ticketHoursPanel(guild, gs));
    case 'modal-ticket-day': {
      const day = gs.ticket.hoursByDay[Number(a)];
      day.active = /^s/i.test(get('active'));
      day.openAt = get('openAt');
      day.closeAt = get('closeAt');
      return sendOrUpdate(interaction, ticketHoursPanel(guild, gs));
    }
    case 'modal-ticket-note':
      return interaction.reply({ content: `Observação registrada no ticket: ${get('note')}`, ephemeral: true });
    case 'modal-ticket-rename': {
      const ticket = gs.tickets.find((item) => item.id === a);
      if (!ticket || !isCartAdmin(interaction, gs)) return interaction.reply({ content: 'Você não pode renomear este ticket.', ephemeral: true });
      const name = get('name').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90);
      await interaction.channel?.setName?.(name).catch(() => null);
      return interaction.reply({ content: `✅ | Ticket renomeado para \`${name}\`.`, ephemeral: true });
    }
    case 'modal-ticket-add-member': {
      const ticket = a === 'current'
        ? gs.tickets.find((item) => item.channelId === interaction.channelId && item.status === 'open')
        : gs.tickets.find((item) => item.id === a);
      if (!ticket) return interaction.reply({ content: 'Ticket não encontrado.', ephemeral: true });
      const userId = get('userId');
      const channel = interaction.channel;
      if (channel?.members?.add) await channel.members.add(userId).catch(() => null);
      else if (channel?.permissionOverwrites?.edit) await channel.permissionOverwrites.edit(userId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }).catch(() => null);
      return interaction.reply({ content: `✅ | <@${userId}> foi adicionado ao ticket.`, ephemeral: true });
    }
    case 'modal-automation-config': {
      const config = gs.automations[a];
      if ('content' in config) config.content = get('value1');
      if ('interval' in config) config.interval = get('value2') || config.interval;
      if ('everyMinutes' in config) config.everyMinutes = Number(get('value1')) || config.everyMinutes;
      if ('lockAt' in config) config.lockAt = get('value1') || config.lockAt;
      if ('unlockAt' in config) config.unlockAt = get('value2') || config.unlockAt;
      return sendOrUpdate(interaction, automationFeaturePanel(guild, gs, a));
    }
    case 'modal-custom-colors':
      gs.customization.colors.default = get('default');
      gs.customization.colors.success = get('success');
      gs.customization.colors.error = get('error');
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'colors'));
    case 'modal-custom-color':
      if (Object.hasOwn(gs.customization.colors, a)) gs.customization.colors[a] = get('color');
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'colors'));
    case 'modal-custom-bot':
      gs.customization.bot.nickname = get('nickname');
      gs.customization.bot.avatar = get('avatar');
      gs.customization.bot.banner = get('banner');
      gs.customization.bot.status = get('status') || 'Online';
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'bot'));
    case 'modal-custom-bot-field': {
      const value = get('value');
      gs.customization.bot[a] = value;
      if (a === 'nickname' && value) await guild.members.me?.setNickname(value).catch(() => null);
      if (a === 'status1') interaction.client.user.setPresence({ activities: value ? [{ name: value }] : [], status: 'online' });
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'bot'));
    }
    case 'modal-custom-brand':
      gs.customization.brand.qrLogo = get('qrLogo');
      gs.customization.brand.qrColor = get('qrColor');
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'brand'));
    case 'modal-custom-public-image':
      gs.customization.publicLog.image = get('image');
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'public-log'));
    case 'modal-custom-product-color':
      gs.customization.productMessages.sideColor = get('color');
      for (const item of gs.products) await syncSaleMessage(guild, item);
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'product-v2'));
    case 'modal-custom-feedback':
      gs.customization.feedbackDm.message = get('message');
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'feedback-dm'));
    case 'modal-custom-feedback-button':
      gs.customization.feedbackDm.buttonText = get('buttonText');
      return sendOrUpdate(interaction, customDetailPanel(guild, gs, 'feedback-dm'));
    case 'modal-zenwallet-consult':
      return interaction.reply({ content: `Pagamento \`${get('paymentId')}\`: \`Pendente/Não encontrado no ambiente local\`.`, ephemeral: true });
    case 'modal-protect-raid':
      gs.protect.raidLimit = Number(get('limit')) || gs.protect.raidLimit;
      gs.protect.raidWindowSeconds = Number(get('seconds')) || gs.protect.raidWindowSeconds;
      gs.protect.raidPunishment = get('punishment');
      return sendOrUpdate(interaction, protectDetailPanel(guild, gs, 'antiraid'));
    case 'modal-protect-selfbot-limit':
      gs.protect.selfBot.limit = Math.max(3, Math.min(20, Number(get('limit')) || 4));
      return sendOrUpdate(interaction, protectSelfBotPanel(guild, gs));
    case 'modal-antifake':
      gs.antiFake.minimumAccountDays = Math.max(0, Math.min(365, Number(get('days')) || 7));
      gs.antiFake.action = get('action') || 'Registrar em log';
      return sendOrUpdate(interaction, antiFakePanel(guild, gs));
    case 'modal-stock-request':
      gs.stockRequests.push({ type: 'stock', userId: interaction.user.id, product: get('product'), quantity: get('quantity'), at: Date.now() });
      return interaction.reply({ content: `Solicitação de estoque registrada para \`${get('product')}\`.`, ephemeral: true });

    case 'modal-auth-logo': {
      gs.auth = gs.auth || {};
      gs.auth.logoUrl = get('logoUrl') || '';
      await salvarAuthConfigNoFirebase(gs.auth);
      return sendOrUpdate(interaction, authPanel(guild, gs));
    }
    case 'modal-auth-cores': {
      gs.auth = gs.auth || {};
      const hex = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : fallback);
      gs.auth.cor = hex(get('cor'), gs.auth.cor || '#5865F2');
      gs.auth.fundo1 = hex(get('fundo1'), gs.auth.fundo1 || '#1e1b4b');
      gs.auth.fundo2 = hex(get('fundo2'), gs.auth.fundo2 || '#312e81');
      await salvarAuthConfigNoFirebase(gs.auth);
      return sendOrUpdate(interaction, authPanel(guild, gs));
    }
    case 'modal-auth-textos': {
      gs.auth = gs.auth || {};
      gs.auth.titulo = get('titulo') || gs.auth.titulo;
      gs.auth.descricao = get('descricao') || gs.auth.descricao;
      gs.auth.textoBotao = get('textoBotao') || gs.auth.textoBotao;
      await salvarAuthConfigNoFirebase(gs.auth);
      return sendOrUpdate(interaction, authPanel(guild, gs));
    }
    case 'modal-auth-link': {
      gs.auth = gs.auth || {};
      let url = get('url').trim();
      if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
      gs.auth.authUrl = url.replace(/\/+$/, '');
      await salvarAuthConfigNoFirebase(gs.auth);
      return sendOrUpdate(interaction, authPanel(guild, gs));
    }
    case 'modal-auth-cargo': {
      gs.auth = gs.auth || {};
      const cargoId = (get('cargoId') || '').replace(/\D/g, '');
      if (!cargoId) return interaction.reply({ content: `${EMOJI.no} | ID de cargo inválido.`, flags: 64 });
      let aviso = '';
      try {
        const role = await guild.roles.fetch(cargoId);
        if (!role) return interaction.reply({ content: `${EMOJI.no} | Não encontrei esse cargo neste servidor.`, flags: 64 });
        if (role.managed || cargoId === guild.id) {
          return interaction.reply({ content: `${EMOJI.no} | Esse cargo não pode ser atribuído (é gerenciado por integração ou é @everyone).`, flags: 64 });
        }
        if (guild.members.me && role.comparePositionTo(guild.members.me.roles.highest) >= 0) {
          aviso = `\n⚠️ Meu cargo está abaixo de <@&${cargoId}> — mova meu cargo para cima para eu conseguir atribuí-lo.`;
        }
      } catch {
        return interaction.reply({ content: `${EMOJI.no} | Erro ao verificar o cargo. Tente novamente.`, flags: 64 });
      }
      gs.auth.cargoVerificadoId = cargoId;
      await salvarAuthConfigNoFirebase(gs.auth);
      await interaction.reply({
        content: `${EMOJI.yesgenesis} | Cargo verificado definido: <@&${cargoId}>${aviso}`,
        flags: 64,
      });
      return sendOrUpdate(interaction, authPanel(guild, gs)).catch(() => {});
    }
    case 'modal-add-admin': {
      gs.adminsPermitidos = Array.isArray(gs.adminsPermitidos) ? gs.adminsPermitidos : [];
      const extrair = (txt) => (txt || '').match(/\d{17,20}/g) || [];
      const paraAdd = extrair(get('adicionar'));
      const paraRemover = extrair(get('remover'));
      let addOk = 0, remOk = 0;
      for (const uid of paraAdd) {
        if (!gs.adminsPermitidos.includes(uid)) {
          gs.adminsPermitidos.push(uid);
          addOk++;
        }
      }
      for (const uid of paraRemover) {
        const idx = gs.adminsPermitidos.indexOf(uid);
        if (idx !== -1) {
          gs.adminsPermitidos.splice(idx, 1);
          remOk++;
        }
      }
      await interaction.reply({
        content: `${EMOJI.yesgenesis} | **Acessos atualizados!** +${addOk} adicionado(s), -${remOk} removido(s).\n**Total com acesso extra:** \`${gs.adminsPermitidos.length}\``,
        flags: 64,
      });
      return sendOrUpdate(interaction, mainPanel(guild, gs)).catch(() => {});
    }
    case 'modal-auth-banner': {
      gs.auth = gs.auth || {};
      gs.auth.bannerUrl = get('bannerUrl').trim();
      await salvarAuthConfigNoFirebase(gs.auth);
      return sendOrUpdate(interaction, authPanel(guild, gs));
    }
    case 'modal-auth-puxar': {
      try {
        await interaction.deferReply({ flags: 64 });
        const amount = Math.max(1, Math.min(5000, Number(get('amount')) || 1));
        const targetGuildId = (get('targetGuild') || '').replace(/\D/g, '');
        if (!targetGuildId) return interaction.editReply({ content: `${EMOJI.no} | ID do servidor alvo inválido.` });

        // ── Pré-checagem: o bot precisa ESTAR no servidor alvo ──
        const alvoGuild = await interaction.client.guilds.fetch(targetGuildId).catch(() => null);
        if (!alvoGuild) {
          const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID || CLIENT_ID}&scope=bot%20applications.commands&permissions=268446734`;
          return interaction.editReply({
            content: `${EMOJI.no} | **Não estou no servidor alvo!** Adicione-me lá primeiro e tente de novo:\n[Adicionar bot nesse servidor](${inviteUrl})`,
          });
        }
        const meNoAlvo = await alvoGuild.members.fetchMe().catch(() => null);
        if (!meNoAlvo || !meNoAlvo.permissions.has('CreateGuildExpressions') && !meNoAlvo.permissions.has('ManageRoles')) {
          // segue mesmo assim; erros individuais serão reportados
        }

        const lista = await listarVerificadosFirebase();
        const alvo = lista.slice(0, amount);
        if (!alvo.length) return interaction.editReply({ content: `${EMOJI.no} | Nenhum membro verificado no Firebase ainda.` });

        const progresso = (p, t, ok, ja, falha) =>
          `## 🚚 Puxando membros…\n**Progresso:** ${p}/${t}\n**Puxados:** ${ok} · **Já estavam:** ${ja} · **Falhas:** ${falha}`;
        await interaction.editReply({ content: progresso(0, alvo.length, 0, 0, 0) });

        const puxarComToken = async (userId, accessToken) => {
          const res = await fetch(`https://discord.com/api/v10/guilds/${targetGuildId}/members/${userId}`, {
            method: 'PUT',
            headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken }),
          });
          let motivo = '';
          if (res.status === 403) motivo = 'sem permissão/token inválido';
          else if (res.status === 404) motivo = 'usuário não encontrado';
          else if (res.status === 429) motivo = 'rate limit';
          else if (res.status >= 500) motivo = 'erro do Discord';
          return { status: res.status, motivo };
        };

        const renovarToken = async (u) => {
          const secret = process.env.CLIENT_SECRET;
          if (!secret || !u.refresh_token) return null;
          try {
            const body = new URLSearchParams({
              client_id: process.env.CLIENT_ID || '',
              client_secret: secret,
              grant_type: 'refresh_token',
              refresh_token: u.refresh_token,
            });
            const res = await fetch('https://discord.com/api/oauth2/token', { method: 'POST', body });
            if (!res.ok) return null;
            const data = await res.json();
            await salvarTokensFirebase(u.id, { access_token: data.access_token, refresh_token: data.refresh_token });
            return data.access_token;
          } catch { return null; }
        };

        let puxados = 0, jaEstavam = 0, falhas = 0, processados = 0;
        const motivos = {};
        const espera = (ms) => new Promise((r) => setTimeout(r, ms));

        for (const u of alvo) {
          if (!u.access_token) { falhas++; processados++; continue; }
          try {
            let resultado = await puxarComToken(u.id, u.access_token);
            if (resultado.status !== 201 && resultado.status !== 204) {
              const novoToken = await renovarToken(u);
              if (novoToken) resultado = await puxarComToken(u.id, novoToken);
            }
            if (resultado.status === 201) puxados++;
            else if (resultado.status === 204) jaEstavam++;
            else {
              falhas++;
              const m = resultado.motivo || `HTTP ${resultado.status}`;
              motivos[m] = (motivos[m] || 0) + 1;
            }
          } catch { falhas++; }
          processados++;
          if (processados % 5 === 0 || processados === alvo.length) {
            await interaction.editReply({ content: progresso(processados, alvo.length, puxados, jaEstavam, falhas) }).catch(() => {});
          }
          await espera(600); // evita rate limit
        }

        const linhasMotivo = Object.entries(motivos)
          .map(([m, q]) => `-# ${q}x ${m}`)
          .join('\n');
        const dica = falhas > 0 && puxados === 0
          ? '\n> 💡 Se todas falharam com "sem permissão": verifique se o bot tem cargo **acima** dos membros e permissão de gerenciar cargos no servidor alvo.'
          : '';
        await interaction.editReply({
          content: `# ✅ Puxão concluído!\n**Puxados:** ${puxados}\n**Já estavam no servidor:** ${jaEstavam}\n**Falhas:** ${falhas}${linhasMotivo ? `\n\n**Motivos:**\n${linhasMotivo}` : ''}${dica}`,
        }).catch(() => {});
        return;
      } catch (err) {
        console.error('[puxar]', err);
        return interaction.editReply({ content: `${EMOJI.no} | Erro no puxão: \`${err.message}\`` }).catch(() => {});
      }
    }
    default:
      return interaction.reply({ content: 'Não foi possível identificar este formulário. Abra o painel novamente.', ephemeral: true });
  }
}
}
