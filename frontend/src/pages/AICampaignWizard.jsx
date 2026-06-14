import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import '../styles/AICampaignWizard.css';

const LOADING_STEPS = [
  { text: 'Analyzing customer segments...', completedText: 'Audience identified', icon: 'psychology' },
  { text: 'Selecting optimal channel...', completedText: 'Channel selected', icon: 'sync' },
  { text: 'Generating campaign message...', completedText: 'Content created', icon: 'auto_awesome' },
  { text: 'Predicting campaign performance...', completedText: 'Forecast generated', icon: 'insights' },
  { text: 'Finalizing strategy...', completedText: 'Campaign Ready', icon: 'check_circle' }
];

const AICampaignWizard = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingError, setLoadingError] = useState(false);
  const [retryPrompt, setRetryPrompt] = useState('');

  const handleSendPrompt = async (promptText) => {
    const promptToSend = promptText || inputText;
    if (!promptToSend) return;

    // Save prompt for retry if needed
    setRetryPrompt(promptToSend);
    
    // Add user message to log
    const newMessages = [...messages, { sender: 'user', text: promptToSend }];
    setMessages(newMessages);
    setInputText('');
    
    setLoading(true);
    setLoadingStep(0);
    setLoadingError(false);

    let apiFinished = false;
    let apiResult = null;
    let apiError = null;

    // Start API generation in parallel
    api.generateAICampaign(promptToSend)
      .then(res => {
        apiResult = res;
        apiFinished = true;
      })
      .catch(err => {
        apiError = err;
        apiFinished = true;
      });

    // Animate loading steps sequentially
    let step = 0;
    const stepInterval = setInterval(() => {
      if (step < 4) {
        step += 1;
        setLoadingStep(step);
      } else {
        clearInterval(stepInterval);
        checkCompletion();
      }
    }, 400);

    const checkCompletion = () => {
      const waitInterval = setInterval(() => {
        if (apiFinished) {
          clearInterval(waitInterval);
          setLoading(false);
          
          if (apiError) {
            setLoadingError(true);
          } else if (apiResult && apiResult.strategy) {
            setMessages([...newMessages, {
              sender: 'ai',
              text: `Based on your request, I've generated this campaign strategy:`,
              strategy: apiResult.strategy
            }]);
          } else {
            setLoadingError(true);
          }
        }
      }, 100);
    };
  };

  const handleCreateDraft = async (strategy) => {
    try {
      setLoading(true);
      const draftName = prompt('Enter a name for this campaign draft:', `${strategy.title} - Draft`);
      if (!draftName) {
        setLoading(false);
        return;
      }

      const res = await api.createCampaign({
        name: draftName,
        targetSegment: strategy.targetSegment,
        channel: strategy.channel,
        subject: strategy.message.subject,
        content: strategy.message.body,
        objective: strategy.objective,
        segmentLabel: strategy.segmentLabel,
        optimalTime: strategy.optimalTime,
        predictedOpenRate: strategy.predictions ? strategy.predictions.openRate : 0,
        predictedConversionRate: strategy.predictions ? strategy.predictions.conversionRate : 0,
        targetFilter: strategy.targetFilter || {}
      });

      alert('Campaign Draft created successfully in MongoDB database!');
      navigate(`/campaign-review/${res.data._id}`);
    } catch (error) {
      alert('Error creating campaign draft: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container wiz-container">
      {/* Ambient background glows */}
      <div className="wiz-ambient-glow-left"></div>
      <div className="wiz-ambient-glow-right"></div>

      {/* Chat Messages Log */}
      <div className="wiz-chat-log">
        {messages.length === 0 && !loading && !loadingError && (
          <div className="wiz-empty-state wiz-fade-in">
            <div className="wiz-empty-icon-wrapper ai-glow">
              <span className="material-symbols-outlined wiz-empty-main-icon">auto_awesome</span>
            </div>
            <h2 className="font-display-md wiz-empty-title">Create an AI-Powered Campaign</h2>
            <p className="wiz-empty-desc">
              Describe your audience and campaign goal. AI will generate the strategy, segment, message, channel recommendation, and performance forecast.
            </p>
            
            <div className="wiz-presets-row" style={{ marginTop: '24px', flexWrap: 'wrap' }}>
              <button onClick={() => handleSendPrompt('Win-back campaign targeting inactive customers who spent over ₹5000 in Mumbai')} className="badge badge-neutral wiz-preset-badge">
                Win-back Mumbai High Spenders
              </button>
              <button onClick={() => handleSendPrompt('Welcome campaign via Email for new signups this week')} className="badge badge-neutral wiz-preset-badge">
                Welcome new customers
              </button>
              <button onClick={() => handleSendPrompt('Exclusive VIP rewards offer via WhatsApp')} className="badge badge-neutral wiz-preset-badge">
                VIP rewards offer
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`wiz-msg-row ${msg.sender === 'user' ? 'user-msg' : 'ai-msg'}`}>
            {msg.sender === 'ai' && (
              <div className="wiz-ai-avatar">
                <span className="material-symbols-outlined wiz-ai-avatar-icon">auto_awesome</span>
              </div>
            )}

            <div className={`wiz-msg-wrapper ${msg.sender === 'user' ? 'user-msg' : 'ai-msg'}`}>
              <div className={`wiz-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                <p className={`wiz-bubble-text ${msg.sender === 'ai' ? 'ai-text' : ''}`}>{msg.text}</p>
              </div>

              {/* Strategy Card block if AI response contains strategy */}
              {msg.strategy && (
                <div className="card ai-glow wiz-reveal-card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Card Header */}
                  <div className="wiz-card-header">
                    <div className="wiz-card-header-title">
                      <span className="material-symbols-outlined wiz-card-header-icon">strategy</span>
                      <h3 className="font-headline-md wiz-card-title">{msg.strategy.title}</h3>
                    </div>
                    <span className="badge badge-primary">AI Recommendation</span>
                  </div>

                  {/* Card Body */}
                  <div className="wiz-card-body grid-2">
                    {/* Left details */}
                    <div className="wiz-card-body-left">
                      <div>
                        <p className="font-label-sm wiz-section-label">Target Segment</p>
                        <div className="wiz-segment-box">
                          <div className="wiz-icon-box">
                            <span className="material-symbols-outlined wiz-icon-box-icon">group</span>
                          </div>
                          <div>
                            <p className="wiz-segment-title">{msg.strategy.targetSegment}</p>
                            <p className="wiz-segment-subtitle">{msg.strategy.segmentLabel}</p>
                          </div>
                        </div>
                      </div>

                      {/* Recommended Channel & Reasoning */}
                      <div>
                        <p className="font-label-sm wiz-section-label">Recommended Channel</p>
                        <div className="wiz-segment-box">
                          <div className="wiz-icon-box">
                            <span className="material-symbols-outlined wiz-icon-box-icon">
                              {msg.strategy.channel === 'Email' ? 'mail' : msg.strategy.channel === 'WhatsApp' ? 'chat' : msg.strategy.channel === 'SMS' ? 'sms' : 'notifications'}
                            </span>
                          </div>
                          <div>
                            <p className="wiz-segment-title">{msg.strategy.channel}</p>
                          </div>
                        </div>
                        {msg.strategy.channelReasoning && (
                          <div className="wiz-channel-reasoning-container">
                            <p className="wiz-reasoning-text" style={{ whiteSpace: 'pre-line' }}>
                              {msg.strategy.channelReasoning}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="wiz-meta-grid">
                        <div className="wiz-meta-box">
                          <p className="font-label-sm wiz-meta-label">Optimal Time</p>
                          <p className="wiz-meta-val-text">{msg.strategy.optimalTime}</p>
                        </div>
                        <div className="wiz-meta-box">
                          <p className="font-label-sm wiz-meta-label">Predictions</p>
                          <p className="wiz-meta-val-text" style={{ margin: 0 }}>Open: {msg.strategy.predictions?.openRate || msg.strategy.predictedOpenRate || 0}%</p>
                          <p className="wiz-meta-val-text" style={{ margin: 0 }}>Conv: {msg.strategy.predictions?.conversionRate || msg.strategy.predictedConversionRate || 0}%</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-label-sm wiz-section-label">Objective</p>
                        <p className="wiz-objective-text">
                          {msg.strategy.objective}
                        </p>
                      </div>
                    </div>

                    {/* Right message copy */}
                    <div className="wiz-card-body-right">
                      <div className="wiz-copy-header">
                        Generated Message Preview
                      </div>
                      <div className="wiz-copy-body">
                        {msg.strategy.message?.subject && (
                          <p className="wiz-copy-subject">
                            Subject: {msg.strategy.message.subject}
                          </p>
                        )}
                        <div className="wiz-copy-text">
                          {msg.strategy.message?.body}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="wiz-card-footer">
                    <button className="btn btn-secondary" onClick={() => handleSendPrompt(`Regenerate campaign with different messaging or channel option`)}>Regenerate</button>
                    <button className="btn btn-primary" onClick={() => handleCreateDraft(msg.strategy)}>
                      <span className="material-symbols-outlined wiz-card-footer-icon">rocket_launch</span>
                      Create Campaign Draft
                    </button>
                  </div>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="wiz-user-avatar">
                <img className="wiz-user-avatar-img" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNq1-4Jt_DVrQWZYEOMB8kzj0R41L33dLfxQAIZsnWl2al_ni205jP6ODXdWJjdPRWFuIT0YA1cTwZ72FL_DiTNGQIfok48iKZJfupDUE6yA5z9ms700hMVF47wJk1msAq5YqVL3oNu9Yf18JF8YFSprMXxDwUtSGRN-qNyaPExPt7LP8R9ueFPjeECTcuer4GUI5wjKfBFjlPgHocLPAiIknzvXsCJSTdOXwWGtlH-lclpEFiL1BOgPsDo3ZQOYMrhrOLv3vOIK0-" alt="" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="wiz-msg-row ai-msg">
            <div className="wiz-ai-avatar">
              <span className="material-symbols-outlined wiz-ai-avatar-icon animate-pulse">auto_awesome</span>
            </div>
            
            <div className="wiz-msg-wrapper ai-msg" style={{ width: '100%', maxWidth: '640px' }}>
              <div className="card wiz-loading-card ai-glow wiz-fade-in" style={{ width: '100%' }}>
                <div className="wiz-loading-card-header">
                  <span className="material-symbols-outlined wiz-loading-card-header-icon">psychology</span>
                  <h3 className="font-headline-md wiz-loading-card-title">🤖 AI Campaign Strategist</h3>
                </div>
                
                <div className="wiz-loading-steps">
                  {LOADING_STEPS.map((step, idx) => {
                    const isActive = loadingStep === idx;
                    const isCompleted = loadingStep > idx;
                    
                    let iconName = step.icon;
                    let iconClass = '';
                    let stepClass = 'wiz-loading-step';
                    
                    if (isCompleted) {
                      iconName = 'check_circle';
                      iconClass = 'wiz-step-completed-icon';
                      stepClass += ' completed';
                    } else if (isActive) {
                      iconName = 'sync';
                      iconClass = 'wiz-spinner';
                      stepClass += ' active';
                    } else {
                      iconClass = 'wiz-step-pending-icon';
                      stepClass += ' pending';
                    }
                    
                    return (
                      <div key={idx} className={stepClass}>
                        <span className={`material-symbols-outlined ${iconClass}`}>
                          {iconName}
                        </span>
                        <span className="wiz-step-text">
                          {isCompleted ? `✓ ${step.completedText}` : step.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {loadingError && (
          <div className="wiz-msg-row ai-msg">
            <div className="wiz-ai-avatar">
              <span className="material-symbols-outlined wiz-ai-avatar-icon">auto_awesome</span>
            </div>
            <div className="wiz-msg-wrapper ai-msg" style={{ width: '100%', maxWidth: '480px' }}>
              <div className="card wiz-error-card ai-glow wiz-fade-in" style={{ padding: '24px' }}>
                <div className="wiz-error-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--error)' }}>
                  <span className="material-symbols-outlined wiz-error-icon" style={{ fontSize: '32px' }}>error</span>
                  <h3 className="font-headline-md wiz-error-title" style={{ margin: 0 }}>Unable to generate campaign strategy.</h3>
                </div>
                <p className="wiz-error-desc" style={{ marginTop: '12px', fontSize: '14px', color: 'var(--on-surface-variant)' }}>
                  There was a connectivity issue while querying the AI. You can retry with your original prompt.
                </p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleSendPrompt(retryPrompt)}
                  style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}
                >
                  <span className="material-symbols-outlined">refresh</span>
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Prompt Input (Fixed Bottom) */}
      <div className="wiz-input-bar-container">
        <div className="wiz-input-bar-inner">
          <div className="gradient-border ai-glow wiz-input-box-gradient">
            <div className="wiz-input-spark-icon-wrapper">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendPrompt()}
              placeholder={messages.length === 0 ? "Describe your audience and campaign goal..." : "Refine this campaign, or ask for another strategy..."}
              className="wiz-input-field"
              disabled={loading}
            />

            <button 
              onClick={() => handleSendPrompt()} 
              className="wiz-input-send-btn"
              disabled={loading || !inputText.trim()}
              style={{ opacity: (loading || !inputText.trim()) ? 0.5 : 1 }}
            >
              <span className="material-symbols-outlined wiz-input-send-btn-icon">arrow_upward</span>
            </button>
          </div>

          {messages.length > 0 && (
            <div className="wiz-presets-row">
              <button onClick={() => handleSendPrompt('Add an SMS variant')} className="badge badge-neutral wiz-preset-badge" disabled={loading}>
                Add an SMS variant
              </button>
              <button onClick={() => handleSendPrompt('Make the tone more urgent')} className="badge badge-neutral wiz-preset-badge" disabled={loading}>
                Make tone more urgent
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICampaignWizard;
