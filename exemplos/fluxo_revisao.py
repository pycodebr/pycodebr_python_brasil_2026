"""Laboratório local: estados fictícios, sem rede ou execução de comandos.

`commit-a` é um identificador didático, não um SHA real. Nenhum método
implementa autenticação, Git, CI, mensagens ou deploy em sistemas externos.
"""

import argparse
import json
from dataclasses import dataclass, field
from enum import Enum


class State(str, Enum):
    REPORTED = "reported"
    TRIAGED = "triaged"
    CHANGED = "changed"
    TESTED = "tested"
    PR_OPEN = "pr_open"
    WAITING_APPROVAL = "waiting_approval"
    APPROVED = "approved"
    MERGE_UNCONFIRMED = "merge_unconfirmed"
    MERGED = "merged"
    DEPLOY_UNCONFIRMED = "deploy_unconfirmed"
    DEPLOY_FAILED = "deploy_failed"
    VERIFIED = "verified"
    RESOLUTION_UNCONFIRMED = "resolution_unconfirmed"
    RESOLVED = "resolved"


class GateBlocked(ValueError):
    """O fluxo não tem evidência suficiente para avançar."""


@dataclass
class ReviewWorkflow:
    """Um report, um PR e um ambiente fictícios; dados apenas na memória."""

    report_id: str = "report-demo-001"
    report_kind: str = "bug"
    state: State = State.REPORTED
    report_status: str = "open"
    current_commit: str | None = None
    tests_commit: str | None = None
    notification_commit: str | None = None
    approved_commit: str | None = None
    approved_actor: str | None = None
    merged_commit: str | None = None
    active_commit: str | None = None
    target_report_status: str = "open"
    events: list[dict[str, str]] = field(default_factory=list)

    def record(self, action: str, detail: str) -> None:
        self.events.append({
            "action": action,
            "state": self.state.value,
            "detail": detail,
        })

    def require_state(self, *allowed: State) -> None:
        if self.state not in allowed:
            raise GateBlocked(f"Etapa bloqueada no estado {self.state.value}.")

    def triage(self, *, scope_defined: bool, reproducible: bool) -> None:
        self.require_state(State.REPORTED)
        if self.report_kind not in {"bug", "feature"}:
            raise GateBlocked("Tipo de report não suportado no laboratório.")
        if scope_defined is not True:
            raise GateBlocked("Defina escopo e critérios de aceite.")
        if self.report_kind == "bug" and reproducible is not True:
            raise GateBlocked("Bug sem reprodução: solicitar contexto.")
        self.state = State.TRIAGED
        self.report_status = "in_progress"
        self.target_report_status = "in_progress"
        self.record("triage", f"{self.report_kind}: escopo definido")

    def change(self, commit_id: str) -> None:
        self.require_state(
            State.TRIAGED, State.CHANGED, State.TESTED, State.PR_OPEN,
            State.WAITING_APPROVAL, State.APPROVED,
        )
        if not isinstance(commit_id, str) or not commit_id.strip():
            raise GateBlocked("Informe um commit fictício não vazio.")
        self.current_commit = commit_id
        self.tests_commit = None
        self.notification_commit = None
        self.approved_commit = None
        self.approved_actor = None
        self.state = State.CHANGED
        self.record("change", f"Mudança fictícia: {commit_id}")

    def record_tests(self, *, passed: bool) -> None:
        self.require_state(State.CHANGED)
        if passed is not True:
            raise GateBlocked("Testes falhos ou inconclusivos bloqueiam o PR.")
        self.tests_commit = self.current_commit
        self.state = State.TESTED
        self.record("tests", "Resultado de CI simulado: passou")

    def open_pr(self) -> None:
        self.require_state(State.TESTED)
        self.state = State.PR_OPEN
        self.record("open_pr", "PR fictício pr-demo-001 aberto")

    def notify(self, *, delivered: bool) -> None:
        self.require_state(State.PR_OPEN, State.WAITING_APPROVAL)
        self.notification_commit = (
            self.current_commit if delivered is True else None
        )
        self.state = State.WAITING_APPROVAL
        detail = (
            "Entrega fictícia confirmada; isso não é aprovação"
            if delivered is True else "Entrega não confirmada; bloqueado"
        )
        self.record("notify", detail)

    def approve(
        self, *, actor: str, decision: str | None, commit_id: str,
    ) -> None:
        self.require_state(State.WAITING_APPROVAL)
        if actor != "reviewer" or decision != "approve":
            raise GateBlocked("Exige approve explícito do reviewer fictício.")
        if commit_id != self.current_commit:
            raise GateBlocked("Aprovação não corresponde ao commit atual.")
        if self.notification_commit != self.current_commit:
            raise GateBlocked("Entrega da notificação atual não confirmada.")
        self.approved_actor = actor
        self.approved_commit = commit_id
        self.state = State.APPROVED
        self.record("approve", f"Aprovação fictícia: {actor}, {commit_id}")

    def merge(self, *, outcome: str = "success") -> None:
        self.require_state(State.APPROVED)
        if outcome not in ("success", "ambiguous"):
            raise GateBlocked("Merge falhou ou resultado não reconhecido.")
        if not (
            self.current_commit
            and self.tests_commit == self.current_commit
            and self.approved_commit == self.current_commit
            and self.approved_actor == "reviewer"
        ):
            raise GateBlocked("Commit, testes e aprovação devem coincidir.")
        self.state = State.MERGE_UNCONFIRMED
        self.record(
            "merge_write",
            f"Merge fictício: {outcome}; não repetir sem leitura",
        )

    def confirm_merge(self, *, observed_commit: str) -> None:
        self.require_state(State.MERGE_UNCONFIRMED)
        if observed_commit != self.approved_commit:
            raise GateBlocked("Merge lido não confirma o commit aprovado.")
        self.merged_commit = observed_commit
        self.state = State.MERGED
        self.record("merge_readback", f"Merge confirmado: {observed_commit}")

    def deploy(self, *, outcome: str = "success") -> None:
        self.require_state(State.MERGED)
        if outcome == "failed":
            self.state = State.DEPLOY_FAILED
            self.record("deploy_failed", "Deploy falhou; escalar recuperação")
            raise GateBlocked("Deploy falhou; report continua pendente.")
        if outcome not in ("success", "ambiguous"):
            raise GateBlocked("Resultado de deploy não reconhecido.")
        self.state = State.DEPLOY_UNCONFIRMED
        self.record(
            "deploy_write",
            f"Deploy fictício: {outcome}; verificar versão e função",
        )

    def verify_deploy(
        self, *, active_commit: str, functional_passed: bool,
    ) -> None:
        self.require_state(State.DEPLOY_UNCONFIRMED)
        if (
            active_commit != self.merged_commit
            or functional_passed is not True
        ):
            raise GateBlocked("Versão ou teste funcional não confirmado.")
        self.active_commit = active_commit
        self.state = State.VERIFIED
        self.record("deploy_readback", "Versão e função fictícias conferidas")

    def resolve_report(self, *, outcome: str = "success") -> None:
        self.require_state(State.VERIFIED)
        if outcome not in ("success", "ambiguous"):
            raise GateBlocked("Escrita do report falhou ou não é reconhecida.")
        self.target_report_status = "resolved"
        self.state = State.RESOLUTION_UNCONFIRMED
        self.record("report_write", f"Escrita: {outcome}; leitura pendente")

    def confirm_report(self, *, observed_status: str) -> None:
        self.require_state(State.RESOLUTION_UNCONFIRMED)
        if (
            observed_status != "resolved"
            or self.target_report_status != "resolved"
        ):
            raise GateBlocked("Leitura do report não confirma resolved.")
        self.report_status = observed_status
        self.state = State.RESOLVED
        self.record("report_readback", "Report fictício relido: resolved")
        self.record(
            "completion_notification", "Conclusão fictícia ao reviewer",
        )

    def snapshot(self) -> dict:
        return {
            "simulation": True,
            "notice": "Dados fictícios; nenhuma ação externa executada.",
            "report_id": self.report_id,
            "report_kind": self.report_kind,
            "state": self.state.value,
            "report_status": self.report_status,
            "commit_id": self.current_commit,
            "approved_commit": self.approved_commit,
            "events": list(self.events),
        }


SCENARIOS = (
    "happy_path", "feature", "failed_tests", "silent_approval",
    "ambiguous_approval", "notification_failed", "stale_approval",
    "failed_deploy", "ambiguous_write", "mismatched_readback",
)


def run_demo(scenario: str) -> dict:
    """Percurso determinístico, com entradas de CI/readback fictícias."""
    if scenario not in SCENARIOS:
        raise ValueError("Cenário desconhecido.")
    workflow = ReviewWorkflow(
        report_kind="feature" if scenario == "feature" else "bug",
    )
    blocked_reason = None
    try:
        workflow.triage(
            scope_defined=True, reproducible=scenario != "feature",
        )
        workflow.change("commit-a")
        workflow.record_tests(passed=scenario != "failed_tests")
        workflow.open_pr()
        workflow.notify(delivered=scenario != "notification_failed")
        decision = {
            "silent_approval": None,
            "ambiguous_approval": "talvez",
        }.get(scenario, "approve")
        workflow.approve(
            actor="reviewer", decision=decision, commit_id="commit-a",
        )
        if scenario == "stale_approval":
            workflow.change("commit-b")
        workflow.merge(
            outcome=(
                "ambiguous" if scenario == "ambiguous_write" else "success"
            ),
        )
        if scenario == "ambiguous_write":
            # A tentativa de repetir é bloqueada; não houve outra escrita.
            workflow.merge()
        workflow.confirm_merge(
            observed_commit=(
                "commit-b" if scenario == "mismatched_readback" else "commit-a"
            ),
        )
        workflow.deploy(
            outcome="failed" if scenario == "failed_deploy" else "success",
        )
        workflow.verify_deploy(
            active_commit="commit-a", functional_passed=True,
        )
        workflow.resolve_report()
        workflow.confirm_report(observed_status="resolved")
    except GateBlocked as error:
        blocked_reason = str(error)
        workflow.record("gate_blocked", blocked_reason)

    expected_block = scenario not in {"happy_path", "feature"}
    if expected_block != (blocked_reason is not None):
        raise RuntimeError("Cenário não terminou como previsto.")
    return {
        "scenario": scenario,
        "blocked_reason": blocked_reason,
        **workflow.snapshot(),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="SIMULAÇÃO LOCAL: sem rede ou credenciais.",
    )
    parser.add_argument(
        "--scenario", choices=(*SCENARIOS, "all"), default="happy_path",
        help="Escolha um percurso fictício (padrão: happy_path).",
    )
    args = parser.parse_args(argv)
    result = (
        {
            "simulation": True,
            "scenarios": [run_demo(name) for name in SCENARIOS],
        }
        if args.scenario == "all" else run_demo(args.scenario)
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
