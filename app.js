(function () {
  'use strict';

  /* ============ ИНДИКАТОР ЧТЕНИЯ СТРАНИЦЫ (PROGRESS BAR) ============ */
  
  const progressBarElement = document.getElementById('progress');

  function updateScrollProgress() {
    const documentElement = document.documentElement;
    const scrollPercentage = documentElement.scrollTop / (documentElement.scrollHeight - documentElement.clientHeight);
    
    progressBarElement.style.width = (scrollPercentage * 100) + '%';
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();


  /* ============ ПОЯВЛЕНИЕ ЭЛЕМЕНТОВ ПРИ СКРОЛЛЕ (SCROLL REVEAL) ============ */
  
  let revealElements = Array.from(document.querySelectorAll('.reveal-on-scroll'));

  function checkElementsReveal() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    for (let i = revealElements.length - 1; i >= 0; i--) {
      const element = revealElements[i];
      const boundingRectangle = element.getBoundingClientRect();

      if (boundingRectangle.top < viewportHeight * 0.91 && boundingRectangle.bottom > 0) {
        element.classList.add('in');
        revealElements.splice(i, 1);
      }
    }
  }

  window.addEventListener('scroll', checkElementsReveal, { passive: true });
  window.addEventListener('resize', checkElementsReveal);
  
  checkElementsReveal();
  setTimeout(checkElementsReveal, 120);
  
  window.addEventListener('load', checkElementsReveal);


  /* ============ ПЛАВНЫЙ СКРОЛЛ ДЛЯ ЯКОРНЫХ ССЫЛОК ============ */
  
  document.querySelectorAll('a[href^="#"]').forEach(function (anchorButton) {
    anchorButton.addEventListener('click', function (event) {
      const targetSelector = anchorButton.getAttribute('href');
      const targetElement = document.querySelector(targetSelector);

      if (!targetElement) {
        return;
      }

      event.preventDefault();

      const targetYPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - 40;

      window.scrollTo({
        top: targetYPosition,
        behavior: 'smooth'
      });
    });
  });


  /* ============ КАРУСЕЛЬ КЕЙСОВ (CASE CAROUSEL) ============ */
  
  let currentCaseIndex = 0;
  const casesPassedState = [false, false, false, false, false];
  
  const caseCards = Array.from(document.querySelectorAll('.case-card-item'));
  const progressSteps = Array.from(document.querySelectorAll('.progress-step'));
  const progressLines = Array.from(document.querySelectorAll('.progress-line'));

  function updateCaseProgressUi() {
    progressSteps.forEach(function (step, index) {
      step.classList.toggle('step-active', index === currentCaseIndex);
      step.classList.toggle('step-done', casesPassedState[index]);
    });

    progressLines.forEach(function (line, index) {
      line.classList.toggle('step-done', casesPassedState[index]);
    });
  }

  function scrollToCasesSection() {
    const casesSection = document.getElementById('cases');
    if (!casesSection) {
      return;
    }

    const targetYPosition = casesSection.getBoundingClientRect().top + window.pageYOffset - 40;

    window.scrollTo({
      top: targetYPosition,
      behavior: 'smooth'
    });
  }

  function switchToCase(targetIndex) {
    const currentCard = caseCards[currentCaseIndex];
    currentCard.classList.add('card-exit');

    setTimeout(function () {
      currentCard.classList.remove('card-active', 'card-exit');
      currentCaseIndex = targetIndex;

      const nextCard = caseCards[currentCaseIndex];
      nextCard.classList.add('card-active');

      updateCaseProgressUi();
      scrollToCasesSection();
    }, 380);
  }

  /* Настройка внутренней логики Квизов для каждого кейса */
  caseCards.forEach(function (card, cardIndex) {
    const optionButtons = card.querySelectorAll('.quiz-option-button');
    const quizCheckButton = card.querySelector('.quiz-check-action');
    const resultMessageElement = card.querySelector('.quiz-result-message');
    const nextStepBlock = card.querySelector('.case-next-step-block');
    const nextCaseButton = card.querySelector('.next-case-action');
    let isQuizResolved = false;

    optionButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        if (isQuizResolved) {
          return;
        }
        button.classList.toggle('highlight-text');
      });
    });

    quizCheckButton.addEventListener('click', function () {
      if (isQuizResolved) {
        /* Сброс квиза для повторной попытки */
        isQuizResolved = false;
        quizCheckButton.textContent = 'Проверить';
        resultMessageElement.textContent = '';
        resultMessageElement.className = 'quiz-result-message';
        
        optionButtons.forEach(function (button) {
          button.classList.remove('highlight-text', 'ok', 'bad', 'miss');
        });
        return;
      }

      isQuizResolved = true;
      let isAllAnswersCorrect = true;

      optionButtons.forEach(function (button) {
        const isCorrectOption = button.getAttribute('data-c') === '1';
        const isSelectedByUser = button.classList.contains('highlight-text');
        
        button.classList.remove('highlight-text');

        if (isCorrectOption && isSelectedByUser) {
          button.classList.add('ok');
        } else if (isCorrectOption && !isSelectedByUser) {
          button.classList.add('miss');
          isAllAnswersCorrect = false;
        } else if (!isCorrectOption && isSelectedByUser) {
          button.classList.add('bad');
          isAllAnswersCorrect = false;
        }
      });

      if (isAllAnswersCorrect) {
        resultMessageElement.textContent = '✓ Все нарушения найдены!';
        resultMessageElement.className = 'quiz-result-message win';
        casesPassedState[cardIndex] = true;
        
        updateCaseProgressUi();
        
        nextStepBlock.style.display = 'flex';
        quizCheckButton.style.display = 'none';
      } else {
        resultMessageElement.textContent = 'Не всё верно — зелёным отмечены правильные ответы';
        resultMessageElement.className = 'quiz-result-message lose';
        quizCheckButton.textContent = 'Попробовать ещё раз';
      }
    });

    if (nextCaseButton) {
      nextCaseButton.addEventListener('click', function () {
        if (cardIndex < 4) {
          switchToCase(cardIndex + 1);
        } else {
          /* Все кейсы успешно пройдены — плавный скролл к блоку декларации */
          const declarationSection = document.getElementById('declare');
          if (declarationSection) {
            const targetYPosition = declarationSection.getBoundingClientRect().top + window.pageYOffset - 40;
            
            window.scrollTo({
              top: targetYPosition,
              behavior: 'smooth'
            });
          }
        }
      });
    }
  });

  updateCaseProgressUi();


  /* ============ ИНТЕРАКТИВНАЯ ДЕКЛАРАЦИЯ (DRAG-DROP) ============ */
  
  const DECLARATION_CORRECT_SLOTS = {
    'tool': 'frag-tool',
    'section': 'frag-section',
    'goal': 'frag-goal',
    'self': 'frag-self',
    'resp': 'frag-resp'
  };

  let activeSlotsState = {};

  window.handleDragStart = function (event) {
    const fragment = event.currentTarget;
    if (fragment.classList.contains('used')) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData('text/plain', fragment.id);
    event.dataTransfer.effectAllowed = 'move';
    fragment.classList.add('dragging');
    
    setTimeout(function () {
      fragment.classList.remove('dragging');
    }, 0);
  };

  window.handleDrop = function (event, currentSlot) {
    event.preventDefault();
    currentSlot.classList.remove('over');

    const fragmentId = event.dataTransfer.getData('text/plain');
    const fragmentElement = document.getElementById(fragmentId);
    
    if (!fragmentElement) {
      return;
    }

    const targetSlotKey = currentSlot.getAttribute('data-slot');

    /* Очищаем плашку из предыдущего поля, если она уже куда-то перетаскивалась */
    Object.keys(activeSlotsState).forEach(function (slotKey) {
      if (activeSlotsState[slotKey] === fragmentId) {
        const previousSlot = document.querySelector('.field-drop-zone[data-slot="' + slotKey + '"]');
        if (previousSlot) {
          previousSlot.innerHTML = '<span class="drop-zone-placeholder">Перетащи сюда</span>';
          previousSlot.classList.remove('filled', 'filled-wrong');
        }
        delete activeSlotsState[slotKey];
      }
    });

    /* Если в текущем поле уже была другая плашка, возвращаем её обратно в общий пул */
    if (activeSlotsState[targetSlotKey]) {
      const previousFragmentId = activeSlotsState[targetSlotKey];
      const previousFragmentElement = document.getElementById(previousFragmentId);
      if (previousFragmentElement) {
        previousFragmentElement.classList.remove('used');
      }
    }

    activeSlotsState[targetSlotKey] = fragmentId;
    fragmentElement.classList.add('used');
    
    currentSlot.innerHTML = '<span class="dsf-value">' + fragmentElement.textContent + '</span>';
    currentSlot.classList.add('filled');
    currentSlot.classList.remove('filled-wrong');
  };

  const declarationCheckButton = document.getElementById('declCheck');
  const declarationResetButton = document.getElementById('declReset');
  const declarationHintMessage = document.getElementById('declHint');
  const declarationSuccessScreen = document.getElementById('declSuccess');
  const declarationStatusBadge = document.getElementById('declStatus');

  if (declarationCheckButton) {
    declarationCheckButton.addEventListener('click', function () {
      const requiredSlotsList = ['tool', 'section', 'goal', 'self', 'resp'];
      const filledSlotsCount = requiredSlotsList.filter(function (slotKey) {
        return activeSlotsState[slotKey];
      });

      if (filledSlotsCount.length < requiredSlotsList.length) {
        declarationHintMessage.textContent = 'Заполни все поля перед проверкой';
        declarationHintMessage.className = 'declaration-hint-text lose';
        return;
      }

      let isFormPerfect = true;
      requiredSlotsList.forEach(function (slotKey) {
        const slotElement = document.querySelector('.field-drop-zone[data-slot="' + slotKey + '"]');
        if (!slotElement) {
          return;
        }

        if (activeSlotsState[slotKey] === DECLARATION_CORRECT_SLOTS[slotKey]) {
          slotElement.classList.add('filled');
          slotElement.classList.remove('filled-wrong');
        } else {
          slotElement.classList.add('filled-wrong');
          slotElement.classList.remove('filled');
          isFormPerfect = false;
        }
      });

      if (isFormPerfect) {
        declarationHintMessage.textContent = '✓ Декларация заполнена верно!';
        declarationHintMessage.className = 'declaration-hint-text win';
        
        declarationStatusBadge.textContent = '✓ Подтверждено';
        declarationStatusBadge.style.color = '#6ee7a8';
        
        declarationCheckButton.style.display = 'none';
        declarationResetButton.style.display = '';
        declarationSuccessScreen.style.display = 'flex';
      } else {
        declarationHintMessage.textContent = 'Есть ошибки — красным отмечены неверные поля';
        declarationHintMessage.className = 'declaration-hint-text lose';
        declarationResetButton.style.display = '';
      }
    });
  }

  if (declarationResetButton) {
    declarationResetButton.addEventListener('click', function () {
      activeSlotsState = {};

      document.querySelectorAll('.field-drop-zone').forEach(function (slot) {
        slot.innerHTML = '<span class="drop-zone-placeholder">Перетащи сюда</span>';
        slot.classList.remove('filled', 'filled-wrong');
      });

      document.querySelectorAll('.draggable-fragment-item').forEach(function (fragment) {
        fragment.classList.remove('used');
      });

      declarationHintMessage.textContent = '';
      declarationHintMessage.className = 'declaration-hint-text';
      
      declarationStatusBadge.textContent = '';
      declarationCheckButton.style.display = '';
      declarationResetButton.style.display = 'none';
      declarationSuccessScreen.style.display = 'none';
    });
  }


  /* ============ ИНТЕРАКТИВНАЯ ИГРА (ПОЙМАЙ НАРУШЕНИЕ) ============ */
  
  const statementCardsList = Array.from(document.querySelectorAll('.game-statement-card'));
  const gameCheckButton = document.getElementById('checkBtn');
  const gameResetButton = document.getElementById('resetBtn');
  const gameRetryButton = document.getElementById('retryBtn');
  const gameScoreElement = document.getElementById('score');
  const gameResultOverlay = document.getElementById('result');
  const gameResultTitle = document.getElementById('rTitle');
  const gameResultMessage = document.getElementById('rMsg');
  const gameResultSubtitle = document.getElementById('rSub');
  let isGameChecked = false;

  const VERDICT_TEXTS = {
    correct: 'Верно — это нарушение.',
    missed: 'Пропущено. Это нарушение, его нужно было отметить.',
    falsePos: 'Это честное действие — отмечать не нужно.',
    cleanOk: 'Верно — здесь нарушения нет.'
  };

  function refreshLiveScore() {
    const selectedFlagsCount = statementCardsList.filter(function (card) {
      return card.classList.contains('flag');
    }).length;

    gameScoreElement.textContent = 'отмечено: ' + selectedFlagsCount;
  }

  statementCardsList.forEach(function (card) {
    card.addEventListener('click', function () {
      if (isGameChecked) {
        return;
      }
      card.classList.toggle('flag');
      refreshLiveScore();
    });
  });

  function processGameResults() {
    isGameChecked = true;
    let totalViolationsCount = 0;
    let correctlyFoundCount = 0;
    let totalMistakesCount = 0;

    statementCardsList.forEach(function (card) {
      const isActualViolation = card.getAttribute('data-v') === '1';
      const isFlaggedByUser = card.classList.contains('flag');
      const verdictTextElement = card.querySelector('.statement-verdict-overlay');
      
      card.classList.add('reveal');

      if (isActualViolation) {
        totalViolationsCount++;
      }

      if (isActualViolation && isFlaggedByUser) {
        card.classList.add('correct');
        correctlyFoundCount++;
        verdictTextElement.textContent = VERDICT_TEXTS.correct;
      } else if (isActualViolation && !isFlaggedByUser) {
        card.classList.add('wrong');
        card.classList.add('flag');
        verdictTextElement.textContent = VERDICT_TEXTS.missed;
        totalMistakesCount++;
      } else if (!isActualViolation && isFlaggedByUser) {
        card.classList.add('wrong');
        verdictTextElement.textContent = VERDICT_TEXTS.falsePos;
        totalMistakesCount++;
      } else {
        card.classList.add('correct');
        verdictTextElement.textContent = VERDICT_TEXTS.cleanOk;
      }
    });

    gameScoreElement.textContent = 'нарушений: ' + correctlyFoundCount + ' из ' + totalViolationsCount;
    gameCheckButton.style.display = 'none';
    gameResetButton.style.display = '';

    const isPlaythroughPerfect = (correctlyFoundCount === totalViolationsCount && totalMistakesCount === 0);

    if (isPlaythroughPerfect) {
      gameResultTitle.innerHTML = 'Вы <span class="text-bold">прошли</span>';
      gameResultMessage.innerHTML = 'Вы видите ИИ <span class="text-circled">насквозь<svg viewBox="0 0 200 80" preserveAspectRatio="none"><path d="M16,44 C8,20 70,8 120,10 C172,12 196,26 190,46 C184,66 130,76 80,73 C30,70 6,60 14,38"/></svg></span>.';
      gameResultSubtitle.textContent = 'Все ' + totalViolationsCount + ' нарушений найдены, и ни одного честного действия вы не записали в виновные. Теперь посмотрите на идеальный вуз ниже.';
      gameResultOverlay.querySelector('.handwritten-note').textContent = 'идеальный вуз →';
    } else {
      gameResultTitle.innerHTML = 'Вы <span class="text-bold">проиграли</span>';
      gameResultMessage.innerHTML = 'ИИ снова <span class="text-circled">обманул вас<svg viewBox="0 0 200 80" preserveAspectRatio="none"><path d="M16,44 C8,20 70,8 120,10 C172,12 196,26 190,46 C184,66 130,76 80,73 C30,70 6,60 14,38"/></svg></span>!';
      gameResultSubtitle.textContent = 'Найдено ' + correctlyFoundCount + ' из ' + totalViolationsCount + ' нарушений, ошибок: ' + totalMistakesCount + '. Карточки уже подсвечены — посмотрите, где промахнулись.';
      gameResultOverlay.querySelector('.handwritten-note').textContent = 'исправься →';
    }

    setTimeout(function () {
      gameResultOverlay.classList.add('show', 'in');
    }, 350);
  }

  function resetEntireGame() {
    isGameChecked = false;
    gameResultOverlay.classList.remove('show', 'in');

    statementCardsList.forEach(function (card) {
      card.classList.remove('flag', 'reveal', 'correct', 'wrong');
      card.querySelector('.statement-verdict-overlay').textContent = '';
    });

    gameCheckButton.style.display = '';
    gameResetButton.style.display = 'none';
    refreshLiveScore();
  }

  if (gameCheckButton) {
    gameCheckButton.addEventListener('click', processGameResults);
  }
  
  if (gameResetButton) {
    gameResetButton.addEventListener('click', resetEntireGame);
  }
  
  if (gameRetryButton) {
    gameRetryButton.addEventListener('click', function () {
      const isPassedSuccessfully = gameResultTitle.textContent.indexOf('прошли') !== -1;
      gameResultOverlay.classList.remove('show', 'in');

      if (isPassedSuccessfully) {
        /* Если выиграл — плавно скроллим к финалу к Манифесту Идеального Вуза */
        const idealUniversitySection = document.getElementById('ideal');
        const targetYPosition = idealUniversitySection.getBoundingClientRect().top + window.pageYOffset - 20;
        
        window.scrollTo({
          top: targetYPosition,
          behavior: 'smooth'
        });
      } else {
        /* Если проиграл — сбрасываем сетку и возвращаем к началу карточек */
        resetEntireGame();
        
        const statementsGrid = document.getElementById('statements');
        const targetYPosition = statementsGrid.getBoundingClientRect().top + window.pageYOffset - 80;
        
        window.scrollTo({
          top: targetYPosition,
          behavior: 'smooth'
        });
      }
    });
  }

})();