# 05 — Fluxos principais e estados

## Fluxos (TCC 4.6)

1. **Cadastro e autenticação:** visitante informa os dados obrigatórios (RN-004), valida o contato (RN-005), cria a conta e entra por e-mail e senha (RN-006).
2. **Consulta de excursões:** visitante lista e detalha excursões publicadas, com disponibilidade.
3. **Reserva:** passageiro autenticado seleciona uma excursão, solicita a reserva, tem a disponibilidade verificada, escolhe a modalidade de pagamento e inicia o checkout com retenção temporária de vaga (RN-009 a RN-015).
4. **Pagamento integral:** a confirmação converte a retenção em ocupação e a reserva fica "Pronto para embarque" (RN-016).
5. **Pagamento parcelado:** a primeira parcela ocupa a vaga (RN-017); a segunda quita (RN-018) ou, vencido o prazo, libera a vaga (RN-019, RN-020).
6. **Conclusão automática:** um dia após o fim da excursão, reservas prontas ficam "Concluída" (RN-025).
7. **Cancelamento pelo passageiro:** reembolso conforme a antecedência (RN-027 a RN-029, RN-032).
8. **Cancelamento pela organização:** reembolso integral (RN-031).
9. **Operações administrativas:** configuração de excursões, consulta de reservas e passageiros, alterações manuais auditadas (RN-033 a RN-036).

Um fluxo é avaliado pelo comportamento resultante quando as operações são encadeadas, e não pela presença de telas isoladas.

## Situações da reserva

`Aguardando pagamento` → `Pronto para embarque` → `Concluída`; a partir de qualquer situação não final, `Cancelada`.

## Situações da excursão **[confirmar]**

`Rascunho` → `Publicada` → `Encerrada` → `Concluída`; `Cancelada` a partir de Rascunho, Publicada ou Encerrada.
Origem: estados usados no piloto (draft, published, closed, completed, cancelled). A matriz de
transições completa é decisão dos pesquisadores.

## Situação da retenção de vaga

`Ativa` → `Convertida` (ocupação) ou `Expirada`/`Liberada`.
