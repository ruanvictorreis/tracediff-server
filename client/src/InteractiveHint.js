import React, { Component } from 'react';
import CodeMirror from 'react-codemirror';
import AlertContainer from 'react-alert';
import Highlight from 'react-highlight';
import Ladder from './Ladder';
import Stream from './data/Stream';
import Record from './data/Record';
import $ from 'jquery';
import 'codemirror/mode/python/python';
import { Modal, Header, Segment, Grid, Message, Button } from 'semantic-ui-react';

class InteractiveHint extends Component {
  constructor(props) {
    super(props)
    this.state = {
      test: '',
      repairs: [],

      afterHistory: {},
      beforeHistory: {},
      afterEvents: [],
      beforeEvents: [],

      register: '',
      assignment: '',
      studentCode: '',

      isLoading: false,
      conditionOne: false,
      conditionTwo: false,
      conditionThree: false,
      conditionFour: false,

      result: 0,
      expected: 0,

      claraView: false,
      testCaseView: false,
      traceDiffView: false,
      pythonTutorView: false,

      quizView: false,
      quizOptionOne: false,
      quizOptionTwo: false,
      quizOptionThree: false,
      quizOptionFour: false,
      quizItems: [],
    }

    window.interactiveHint = this
  }

  componentDidMount() {
    this.init()
  }

  init(info) {
    if (!this.refs.editor) return false;
    this.cm = this.refs.editor.getCodeMirror();
    window.cm = this.cm

    if (info) {
      this.setState({ register: info.register });
      this.setState({ assignment: info.assignment });
      this.setState({ studentCode: info.templateCode });
      //this.setState({ condition: info.condition });
      //this.showCondition(info.condition);
      this.toggleConditionOne();
      this.cm.setValue(info.templateCode);
    }
  }

  setRepairs(repairs) {
    this.setState({ repairs: repairs });
  }

  toggleLoader() {
    this.setState({ isLoading: !this.state.isLoading });
  }

  toggleQuiz() {
    this.setState({ quizView: !this.state.quizView });
  }

  toggleQuizOptionOne() {
    this.setState({ quizOptionOne: !this.state.quizOptionOne });
  }

  toggleQuizOptionTwo() {
    this.setState({ quizOptionTwo: !this.state.quizOptionTwo });
  }

  toggleQuizOptionThree() {
    this.setState({ quizOptionThree: !this.state.quizOptionThree });
  }

  toggleQuizOptionFour() {
    this.setState({ quizOptionFour: !this.state.quizOptionFour });
  }

  toggleConditionOne() {
    this.setState({ conditionOne: true });
    this.setState({ conditionTwo: false });
    this.setState({ conditionThree: false });
    this.setState({ conditionFour: false });
    this.setState({ testCaseView: true });
    this.setState({ claraView: false });
    this.setState({ traceDiffView: false });
    this.setState({ pythonTutorView: false });
  }

  toggleConditionTwo() {
    this.setState({ conditionTwo: true });
    this.setState({ conditionOne: false });
    this.setState({ conditionThree: false });
    this.setState({ conditionFour: false });
    this.setState({ testCaseView: true });
    this.setState({ claraView: true });
    this.setState({ traceDiffView: false });
    this.setState({ pythonTutorView: false });
  }

  toggleConditionThree() {
    this.setState({ conditionThree: true });
    this.setState({ conditionTwo: false });
    this.setState({ conditionOne: false });
    this.setState({ conditionFour: false });
    this.setState({ testCaseView: true });
    this.setState({ traceDiffView: true });
    this.setState({ claraView: false });
    this.setState({ pythonTutorView: false });
  }

  toggleConditionFour() {
    this.setState({ conditionFour: true });
    this.setState({ conditionThree: false });
    this.setState({ conditionTwo: false });
    this.setState({ conditionOne: false });
    this.setState({ testCaseView: true });
    this.setState({ pythonTutorView: true });
    this.setState({ traceDiffView: false });
    this.setState({ claraView: false });
  }

  setCurrentCode() {
    this.setState({ studentCode: this.cm.getValue() });
  }

  submitAttempt() {
    if (!this.state.register) {
      return;
    }

    this.toggleLoader();
    this.setCurrentCode();

    var attempt = {
      register: this.state.register,
      studentCode: this.cm.getValue(),
      assignment: this.state.assignment
    };

    this.assertImplementation(attempt);
  }

  assertImplementation(attempt) {
    $.ajax({
      method: 'POST',
      url: 'http://localhost:8081/api/assert/',
      data: attempt
    })
      .then((response) => {
        this.toggleLoader();

        if (response.isCorrect) {
          this.correctSubmission(response);
        } else {
          this.synthesizeFixByClara(response);
        }
      })
  }

  synthesizeFixByClara(attempt) {
    if (attempt.syntaxError) {
      this.syntaxErrorFound(attempt);
      return;
    }

    this.toggleLoader();

    $.ajax({
      method: 'POST',
      url: 'http://localhost:8081/api/clara/',
      data: attempt
    })
      .then((response) => {
        this.toggleLoader();

        if (response.isRepaired) {
          this.setRepairs(response.repairs);
          this.requestTracesDivergence(response);
        } else {
          this.claraRepairFail(response);
        }
      })
  }

  requestTracesDivergence(attempt) {
    var info = {
      studentId: attempt.register,
      date: new Date().toLocaleString(),
      before: attempt.studentCode,
      SynthesizedAfter: attempt.codeRepaired,
      IsFixed: true,
      failed: attempt.errorMsg.split('\n'),
      register: attempt.register,
      assignment: attempt.assignment
    }

    this.toggleLoader();

    $.ajax({
      method: 'POST',
      url: 'http://localhost:8081/api/tracediff',
      data: info
    })
      .then((response) => {
        this.toggleLoader();
        const data = JSON.parse(response);
        this.startInteractiveHint(data);
      })
  }

	/**
saveLogSubmission(attempt) {
	var submissionLog = {
		Condition: this.state.condition,
		Register: this.state.register,
		Assignment: this.state.assignment,
		FixedCode: [],
		IsCorrect: attempt.PassedTests,
		DateTime: new Date().toLocaleString(),
		HasFix: attempt.FixedCodeList != null && attempt.FixedCodeList.length > 0,
		SubmittedCode: this.state.studentCode,
		LogsInteractionList: window.ladder.getInteractionLogs()
	}

	if (submissionLog.HasFix) {
		submissionLog.FixedCode = attempt.FixedCodeList[0];
	}

	$.ajax({
		method: 'POST',
		url: 'http://tracediff-logs.azurewebsites.net/api/SubmissionLogs/',
		data: submissionLog
	})
		.then((response) => {
			window.ladder.clearInteractionLogs();
		})
}*/

  correctSubmission(attempt) {
    this.msg.success('Parabéns! Seu código está correto');

    var info = {
      register: this.state.register,
      assignment: this.state.assignment
    };

    $.ajax({
      method: 'POST',
      url: 'http://localhost:8081/api/quiz',
      data: info
    })
      .then((quiz) => {
        this.setState({ quizItems: quiz.items });
        this.toggleQuiz();
      });

    //this.saveLogSubmission(attempt);
  }

  syntaxErrorFound(attempt) {
    this.msg.error('Seu código possui um ou mais erros de sintaxe');
    //this.saveLogSubmission(attempt);
  }

  claraRepairFail(attempt) {
    this.msg.error('CLARA: Solução muito distante do esperado');
    //this.saveLogSubmission(attempt);
  }

  startInteractiveHint(data) {
    var item = data[0]

    let stream = new Stream()
    stream.generate(item.beforeTraces, item.beforeCode, 'before')
    stream.generate(item.afterTraces, item.afterCode, 'after')
    stream.check()

    let record = new Record()
    record.generate(stream.beforeTraces, 'before')
    record.generate(stream.afterTraces, 'after')
    record.check()

    let state = Object.assign(item, {
      id: item.studentId,
      beforeTraces: stream.beforeTraces,
      afterTraces: stream.afterTraces,
      traces: stream.traces,
      currentCode: item.beforeCode,
      step: 0,
      stop: false,
      beforeHistory: record.beforeHistory,
      afterHistory: record.afterHistory,
      beforeTicks: record.beforeTicks,
      afterTicks: record.afterTicks,
      commonKeys: record.commonKeys,
      focusKeys: record.focusKeys,
      beforeEvents: record.beforeEvents,
      afterEvents: record.afterEvents,
    })

    this.setState(state);
    window.ladder.init()
  }

	/** 
	showCondition(mode) {
		switch (mode) {
			case 1:

				break
			case 2:

				break
			case 3:

				break
			case 4:

				break
		}
	}
  */


  close = () => this.toggleQuiz();

  render() {
    const options = {
      mode: 'python',
      lineNumbers: true
    };

    const inlineStyle = {
      modal: {
        marginTop: '0px !important',
        marginLeft: 'auto',
        marginRight: 'auto'
      }
    };

    const { isLoading } = this.state;

    return (
      <div>

        <div className="loader-wrapper">
          <AlertContainer ref={a => this.msg = a}
            {...{
              offset: 12,
              position: 'bottom left',
              theme: 'light',
              time: 10000,
              transition: 'scale'
            }
            } />
        </div>

        <Modal
          open={this.state.quizView}
          style={inlineStyle.modal}
          closeOnEscape={false}
          closeOnRootNodeClick={false}
          onClose={this.close}>

          <Header icon='cubes' content='Quiz' />
          <Modal.Content>
            <Modal.Description>
              <p>Selecione outras implementações que também sejam corretas para este exercício:</p>
            </Modal.Description>
            <br />
            <Grid centered>
              <Grid.Row stretched>
                <Grid.Column width={8}>
                  <Segment raised>
                    <Button circular toggle icon='checkmark' size="mini" floated="right"
                      active={this.state.quizOptionOne} onClick={this.toggleQuizOptionOne.bind(this)} />
                    <Highlight className="python">
                      {this.state.quizView ? this.state.quizItems[0].code : ''}
                    </Highlight>
                  </Segment>
                </Grid.Column>
                <Grid.Column width={8}>
                  <Segment raised>
                    <Button circular toggle icon='checkmark' size="mini" floated="right"
                      active={this.state.quizOptionTwo} onClick={this.toggleQuizOptionTwo.bind(this)} />
                    <Highlight className="python">
                      {this.state.quizView ? this.state.quizItems[1].code : ''}
                    </Highlight>
                  </Segment>
                </Grid.Column>
              </Grid.Row>

              <Grid.Row stretched>
                <Grid.Column width={8}>
                  <Segment raised>
                    <Button circular toggle icon='checkmark' size="mini" floated="right"
                      active={this.state.quizOptionThree} onClick={this.toggleQuizOptionThree.bind(this)} />
                    <Highlight className="python">
                      {this.state.quizView ? this.state.quizItems[2].code : ''}
                    </Highlight>
                  </Segment>
                </Grid.Column>
                <Grid.Column width={8}>
                  <Segment raised>
                    <Button circular toggle icon='checkmark' size="mini" floated="right"
                      active={this.state.quizOptionFour} onClick={this.toggleQuizOptionFour.bind(this)} />
                    <Highlight className="python">
                      {this.state.quizView ? this.state.quizItems[3].code : ''}
                    </Highlight>
                  </Segment>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Modal.Content>

          <Modal.Actions>
            <Button positive icon='checkmark' labelPosition='right' content="Enviar" onClick={this.close} />
          </Modal.Actions>
        </Modal>

        <Grid>
          <Grid.Row>
            <Grid.Column width={5}>
              <Message>
                <Button.Group floated='right'>
                  <Button toggle active={this.state.conditionOne} onClick={this.toggleConditionOne.bind(this)}>1</Button>
                  <Button toggle active={this.state.conditionTwo} onClick={this.toggleConditionTwo.bind(this)}>2</Button>
                  <Button toggle active={this.state.conditionThree} onClick={this.toggleConditionThree.bind(this)}>3</Button>
                  <Button toggle active={this.state.conditionFour} onClick={this.toggleConditionFour.bind(this)}>4</Button>
                </Button.Group>

                <br />
                <CodeMirror
                  value={this.state.studentCode}
                  ref="editor"
                  options={options} />

                <br />
                <Button primary loading={isLoading} onClick={this.submitAttempt.bind(this)}>Enviar</Button>
              </Message>
            </Grid.Column>

            <Grid.Column width={11}>
              <Message style={{ display: this.state.testCaseView ? 'block' : 'none' }}>
                <h3>Teste</h3>
                <Grid centered>
                  <Grid.Column width={8}>
                    <Highlight className="python">
                      {`# Obtido:\n${this.state.test}\n>>> ${this.state.result}`}
                    </Highlight>
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <Highlight className="python">
                      {`# Esperado:\n${this.state.test}\n>>> ${this.state.expected}`}
                    </Highlight>
                  </Grid.Column>
                </Grid>
              </Message>

              <Message style={{ display: this.state.claraView ? 'block' : 'none' }}>
                <Message.Header>Clara</Message.Header>
                <Message.List items={this.state.repairs} />
              </Message>

              <Message className="ui message hint-message" style={{ display: this.state.pythonTutorView ? 'block' : 'none' }}>
                <h3>Python Tutor</h3>
                <div id="viz" />
              </Message>

              <Message className="ui message hint-message" style={{ display: this.state.traceDiffView ? 'block' : 'none' }}>
                <h3>TraceDiff</h3>
                <Ladder
                  beforeHistory={this.state.beforeHistory}
                  afterHistory={this.state.afterHistory}
                  beforeEvents={this.state.beforeEvents}
                  afterEvents={this.state.afterEvents}
                  beforeTraces={this.state.beforeTraces}
                  afterTraces={this.state.afterTraces}
                  beforeAst={this.state.beforeAst}
                  afterAst={this.state.afterAst}
                  currentCode={this.state.currentCode}
                  beforeCode={this.state.beforeCode}
                  before={this.state.before}
                  focusKeys={this.state.focusKeys}
                  test={this.state.test}
                  expected={this.state.expected}
                  result={this.state.result} />
              </Message>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    )
  }
}

export default InteractiveHint
