# 06 — Modelo conceitual de dados (TCC 4.7)

| Entidade | Campos principais (conceituais) | Relações |
| --- | --- | --- |
| Usuário | nome completo, CPF (único), e-mail (único), data de nascimento, telefone/WhatsApp (validado), hash da senha, perfil | 1 usuário : N reservas |
| Excursão | nome, descrição, imagem (referência), local, ponto de embarque, datas inicial e final, partida (UTC), capacidade, preço (centavos), parcelamento habilitado, prazo da 2ª parcela, situação | 1 excursão : N reservas |
| Reserva | usuário, excursão, modalidade (integral/parcelada), situação, datas | pertence a 1 usuário e 1 excursão; 1 : N pagamentos |
| Pagamento | reserva, parcela (única/1ª/2ª), valor (centavos), situação, datas | pertence a 1 reserva |
| Retenção de vaga | reserva ou checkout, criação, expiração, situação | pertence a 1 reserva |
| Reembolso | reserva, valor (centavos), percentual aplicado, motivo, situação | pertence a 1 reserva |
| Histórico/Auditoria | ator, ação, registro, estado anterior/novo, momento | referencia qualquer entidade |
| Sessão e token | usuário, validade, revogação | pertence a 1 usuário |

Restrições: ocupação nunca excede a capacidade (RN-021); valores em centavos (RN-038); instantes
em UTC (RN-039). Tipos, índices e esquema concreto são decididos na AGT-002 e registrados nela.
