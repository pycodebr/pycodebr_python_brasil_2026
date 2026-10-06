"""Testes reais de um workflow inteiramente fictício e local."""

import contextlib
import io
import json
import unittest

from exemplos import fluxo_revisao
from exemplos.fluxo_revisao import GateBlocked, ReviewWorkflow, State


class ReviewWorkflowTests(unittest.TestCase):
    def ready_for_approval(self, *, delivered=True):
        workflow = ReviewWorkflow()
        workflow.triage(scope_defined=True, reproducible=True)
        workflow.change("commit-a")
        workflow.record_tests(passed=True)
        workflow.open_pr()
        workflow.notify(delivered=delivered)
        return workflow

    def approved_workflow(self):
        workflow = self.ready_for_approval()
        workflow.approve(
            actor="reviewer", decision="approve", commit_id="commit-a",
        )
        return workflow

    def test_only_explicit_current_reviewer_approval_can_advance(self):
        for actor, decision, commit_id in [
            ("reviewer", None, "commit-a"),
            ("reviewer", "talvez", "commit-a"),
            ("reviewer", "👍", "commit-a"),
            ("reviewer", "reject", "commit-a"),
            ("agent", "approve", "commit-a"),
            ("reviewer", "approve", "commit-b"),
        ]:
            with self.subTest(
                actor=actor, decision=decision, commit=commit_id,
            ):
                workflow = self.ready_for_approval()
                with self.assertRaises(GateBlocked):
                    workflow.approve(
                        actor=actor, decision=decision, commit_id=commit_id,
                    )
                self.assertEqual(workflow.state, State.WAITING_APPROVAL)
                self.assertIsNone(workflow.approved_commit)
                with self.assertRaises(GateBlocked):
                    workflow.merge()

    def test_unconfirmed_notification_does_not_authorize_approval(self):
        for delivered in (False, None, "delivered", 1):
            with self.subTest(delivered=delivered):
                workflow = self.ready_for_approval(delivered=delivered)
                self.assertIsNone(workflow.notification_commit)
                with self.assertRaises(GateBlocked):
                    workflow.approve(
                        actor="reviewer", decision="approve",
                        commit_id="commit-a",
                    )
                workflow.notify(delivered=True)
                workflow.approve(
                    actor="reviewer", decision="approve", commit_id="commit-a",
                )
                self.assertEqual(workflow.state, State.APPROVED)

    def test_change_invalidates_tests_notification_and_approval(self):
        workflow = self.approved_workflow()
        workflow.change("commit-b")
        self.assertEqual(workflow.state, State.CHANGED)
        self.assertIsNone(workflow.tests_commit)
        self.assertIsNone(workflow.notification_commit)
        self.assertIsNone(workflow.approved_commit)
        self.assertIsNone(workflow.approved_actor)
        with self.assertRaises(GateBlocked):
            workflow.merge()
        workflow.record_tests(passed=True)
        workflow.open_pr()
        workflow.notify(delivered=True)
        with self.assertRaises(GateBlocked):
            workflow.approve(
                actor="reviewer", decision="approve", commit_id="commit-a",
            )
        workflow.approve(
            actor="reviewer", decision="approve", commit_id="commit-b",
        )
        workflow.merge()
        workflow.confirm_merge(observed_commit="commit-b")
        self.assertEqual(workflow.merged_commit, "commit-b")

    def test_merge_rechecks_current_commit_and_tests(self):
        for field_name in (
            "approved_commit", "tests_commit", "current_commit",
        ):
            with self.subTest(field=field_name):
                workflow = self.approved_workflow()
                setattr(workflow, field_name, "commit-b")
                with self.assertRaises(GateBlocked):
                    workflow.merge()
                self.assertEqual(workflow.state, State.APPROVED)

    def test_invalid_commit_cannot_start_change(self):
        for commit_id in (None, "", "   "):
            with self.subTest(commit=commit_id):
                workflow = ReviewWorkflow()
                workflow.triage(scope_defined=True, reproducible=True)
                with self.assertRaises(GateBlocked):
                    workflow.change(commit_id)
                self.assertIsNone(workflow.current_commit)

    def merged_workflow(self):
        workflow = self.approved_workflow()
        workflow.merge()
        workflow.confirm_merge(observed_commit="commit-a")
        return workflow

    def verified_workflow(self):
        workflow = self.merged_workflow()
        workflow.deploy()
        workflow.verify_deploy(
            active_commit="commit-a", functional_passed=True,
        )
        return workflow

    def test_merge_readback_must_match_approved_commit(self):
        workflow = self.approved_workflow()
        workflow.merge()
        with self.assertRaises(GateBlocked):
            workflow.confirm_merge(observed_commit="commit-b")
        self.assertEqual(workflow.state, State.MERGE_UNCONFIRMED)
        self.assertIsNone(workflow.merged_commit)
        with self.assertRaises(GateBlocked):
            workflow.deploy()

    def test_failed_deploy_keeps_report_pending(self):
        workflow = self.merged_workflow()
        with self.assertRaises(GateBlocked):
            workflow.deploy(outcome="failed")
        self.assertEqual(workflow.state, State.DEPLOY_FAILED)
        self.assertEqual(workflow.report_status, "in_progress")
        with self.assertRaises(GateBlocked):
            workflow.verify_deploy(
                active_commit="commit-a", functional_passed=True,
            )
        with self.assertRaises(GateBlocked):
            workflow.resolve_report()

    def test_deploy_needs_version_and_functional_evidence(self):
        for commit_id, passed in [
            ("commit-b", True), ("commit-a", False),
            ("commit-a", None), ("commit-a", "healthy"), ("commit-a", 1),
        ]:
            with self.subTest(commit=commit_id, passed=passed):
                workflow = self.merged_workflow()
                workflow.deploy()
                with self.assertRaises(GateBlocked):
                    workflow.verify_deploy(
                        active_commit=commit_id, functional_passed=passed,
                    )
                self.assertEqual(workflow.state, State.DEPLOY_UNCONFIRMED)
                self.assertEqual(workflow.report_status, "in_progress")
                with self.assertRaises(GateBlocked):
                    workflow.resolve_report()

    def test_report_readback_is_required_for_resolution(self):
        workflow = self.verified_workflow()
        workflow.resolve_report()
        with self.assertRaises(GateBlocked):
            workflow.confirm_report(observed_status="in_progress")
        self.assertEqual(workflow.state, State.RESOLUTION_UNCONFIRMED)
        self.assertEqual(workflow.report_status, "in_progress")
        self.assertNotIn(
            "completion_notification",
            [event["action"] for event in workflow.events],
        )

    def test_ambiguous_writes_require_readback_not_blind_retry(self):
        cases = [
            (self.approved_workflow, "merge", "confirm_merge",
             {"observed_commit": "commit-a"}, State.MERGED),
            (self.merged_workflow, "deploy", "verify_deploy",
             {"active_commit": "commit-a", "functional_passed": True},
             State.VERIFIED),
            (self.verified_workflow, "resolve_report", "confirm_report",
             {"observed_status": "resolved"}, State.RESOLVED),
        ]
        for build, write_name, read_name, evidence, expected in cases:
            with self.subTest(write=write_name):
                workflow = build()
                getattr(workflow, write_name)(outcome="ambiguous")
                self.assertIn("ambiguous", workflow.events[-1]["detail"])
                with self.assertRaises(GateBlocked):
                    getattr(workflow, write_name)()
                self.assertEqual(workflow.report_status, "in_progress")
                getattr(workflow, read_name)(**evidence)
                self.assertEqual(workflow.state, expected)

    def test_failed_or_unknown_write_cannot_claim_success(self):
        for build, method in [
            (self.approved_workflow, "merge"),
            (self.verified_workflow, "resolve_report"),
        ]:
            for outcome in ("failed", "unknown"):
                with self.subTest(method=method, outcome=outcome):
                    workflow = build()
                    previous_state = workflow.state
                    with self.assertRaises(GateBlocked):
                        getattr(workflow, method)(outcome=outcome)
                    self.assertEqual(workflow.state, previous_state)
                    self.assertEqual(workflow.report_status, "in_progress")
        workflow = self.merged_workflow()
        with self.assertRaises(GateBlocked):
            workflow.deploy(outcome="unknown")
        self.assertEqual(workflow.state, State.MERGED)

    def test_triage_requires_evidence_for_report_kind(self):
        for kind, scope, reproducible in [
            ("bug", False, True),
            ("bug", True, False),
            ("bug", "sim", True),
            ("unknown", True, True),
        ]:
            with self.subTest(kind=kind, scope=scope):
                workflow = ReviewWorkflow(report_kind=kind)
                with self.assertRaises(GateBlocked):
                    workflow.triage(
                        scope_defined=scope, reproducible=reproducible,
                    )
                self.assertEqual(workflow.state, State.REPORTED)
                self.assertEqual(workflow.report_status, "open")
        feature = ReviewWorkflow(report_kind="feature")
        feature.triage(scope_defined=True, reproducible=False)
        self.assertEqual(feature.state, State.TRIAGED)

    def test_no_step_can_skip_its_predecessor(self):
        actions = [
            lambda w: w.change("commit-a"),
            lambda w: w.record_tests(passed=True),
            lambda w: w.open_pr(),
            lambda w: w.notify(delivered=True),
            lambda w: w.approve(
                actor="reviewer", decision="approve", commit_id="commit-a",
            ),
            lambda w: w.merge(),
            lambda w: w.confirm_merge(observed_commit="commit-a"),
            lambda w: w.deploy(),
            lambda w: w.verify_deploy(
                active_commit="commit-a", functional_passed=True,
            ),
            lambda w: w.resolve_report(),
            lambda w: w.confirm_report(observed_status="resolved"),
        ]
        for index, action in enumerate(actions):
            with self.subTest(step=index):
                workflow = ReviewWorkflow()
                with self.assertRaises(GateBlocked):
                    action(workflow)
                self.assertEqual(workflow.state, State.REPORTED)
                self.assertEqual(workflow.events, [])

    def test_failed_or_ambiguous_tests_block_pr(self):
        for passed in (False, None, "passed", 1):
            with self.subTest(passed=passed):
                workflow = ReviewWorkflow()
                workflow.triage(scope_defined=True, reproducible=True)
                workflow.change("commit-a")
                with self.assertRaises(GateBlocked):
                    workflow.record_tests(passed=passed)
                with self.assertRaises(GateBlocked):
                    workflow.open_pr()
                self.assertIsNone(workflow.tests_commit)
                self.assertEqual(workflow.state, State.CHANGED)

    def test_happy_path_requires_readback_before_resolution(self):
        workflow = ReviewWorkflow()
        workflow.triage(scope_defined=True, reproducible=True)
        workflow.change("commit-a")
        workflow.record_tests(passed=True)
        workflow.open_pr()
        workflow.notify(delivered=True)
        workflow.approve(
            actor="reviewer", decision="approve", commit_id="commit-a",
        )
        workflow.merge()
        self.assertEqual(workflow.state, State.MERGE_UNCONFIRMED)
        workflow.confirm_merge(observed_commit="commit-a")
        workflow.deploy(outcome="success")
        self.assertEqual(workflow.report_status, "in_progress")
        workflow.verify_deploy(
            active_commit="commit-a", functional_passed=True,
        )
        workflow.resolve_report()
        self.assertEqual(workflow.report_status, "in_progress")
        workflow.confirm_report(observed_status="resolved")
        self.assertEqual(workflow.state, State.RESOLVED)
        self.assertEqual(workflow.report_status, "resolved")
        self.assertTrue(workflow.snapshot()["simulation"])


class CliTests(unittest.TestCase):
    def test_cli_emits_deterministic_fictitious_json(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            self.assertEqual(fluxo_revisao.main([]), 0)
        result = json.loads(output.getvalue())
        self.assertTrue(result["simulation"])
        self.assertEqual(result["state"], "resolved")
        self.assertIsNone(result["blocked_reason"])
        second = io.StringIO()
        with contextlib.redirect_stdout(second):
            fluxo_revisao.main([])
        self.assertEqual(output.getvalue(), second.getvalue())

    def test_all_scenarios_have_expected_final_states(self):
        expected = {
            "happy_path": "resolved",
            "feature": "resolved",
            "failed_tests": "changed",
            "silent_approval": "waiting_approval",
            "ambiguous_approval": "waiting_approval",
            "notification_failed": "waiting_approval",
            "stale_approval": "changed",
            "failed_deploy": "deploy_failed",
            "ambiguous_write": "merge_unconfirmed",
            "mismatched_readback": "merge_unconfirmed",
        }
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            fluxo_revisao.main(["--scenario", "all"])
        results = json.loads(output.getvalue())["scenarios"]
        self.assertEqual(len(results), len(expected))
        self.assertEqual(
            {item["scenario"]: item["state"] for item in results}, expected,
        )
        for item in results:
            with self.subTest(scenario=item["scenario"]):
                self.assertTrue(item["simulation"])
                if item["state"] == "resolved":
                    self.assertIsNone(item["blocked_reason"])
                    self.assertEqual(item["report_status"], "resolved")
                else:
                    self.assertTrue(item["blocked_reason"])
                    self.assertEqual(item["report_status"], "in_progress")

    def test_unknown_cli_scenario_is_rejected(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
            fluxo_revisao.main(["--scenario", "unknown"])
        self.assertEqual(error.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
