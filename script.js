// Meal Planner Application
(function () {
  'use strict';

  // Constants & State
  const STORAGE_KEY = 'meal_planner_meals_v1';
  let meals = [];
  let deleteTargetId = null;

  // Day order for sorting
  const DAYS_ORDER = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
  };

  // Meal type order for sorting
  const MEAL_TYPE_ORDER = {
    'Breakfast': 1,
    'Lunch': 2,
    'Dinner': 3,
    'Snack': 4
  };

  // DOM Elements
  const mealForm = document.getElementById('mealForm');
  const mealNameInput = document.getElementById('mealName');
  const mealDaySelect = document.getElementById('mealDay');
  const mealTypeSelect = document.getElementById('mealType');
  const mealCookingTimeInput = document.getElementById('mealCookingTime');

  const mealCountEl = document.getElementById('mealCount');
  const mealsContainer = document.getElementById('mealsContainer');
  const emptyStateEl = document.getElementById('emptyState');
  const noResultsStateEl = document.getElementById('noResultsState');

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // Edit Modal Elements
  const editModal = document.getElementById('editModal');
  const editMealForm = document.getElementById('editMealForm');
  const editMealId = document.getElementById('editMealId');
  const editMealName = document.getElementById('editMealName');
  const editMealDay = document.getElementById('editMealDay');
  const editMealType = document.getElementById('editMealType');
  const editMealCookingTime = document.getElementById('editMealCookingTime');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // Delete Modal Elements
  const deleteModal = document.getElementById('deleteModal');
  const deleteMealNameEl = document.getElementById('deleteMealName');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  // Load meals from localStorage
  function loadMeals() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      meals = data ? JSON.parse(data) : [];
      if (!Array.isArray(meals)) {
        meals = [];
      }
    } catch (e) {
      console.error('Error loading meals from localStorage:', e);
      meals = [];
    }
  }

  // Save meals to localStorage
  function saveMeals() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
    } catch (e) {
      console.error('Error saving meals to localStorage:', e);
      alert('Could not save your meal. Your browser storage might be full or disabled.');
    }
  }

  // Update total meals count at the top
  function updateMealCount() {
    mealCountEl.textContent = meals.length;
  }

  // Sort helper: by day of week, then by meal type
  function sortMeals(list) {
    return [...list].sort((a, b) => {
      const dayDiff = (DAYS_ORDER[a.day] || 99) - (DAYS_ORDER[b.day] || 99);
      if (dayDiff !== 0) return dayDiff;
      const typeDiff = (MEAL_TYPE_ORDER[a.type] || 99) - (MEAL_TYPE_ORDER[b.type] || 99);
      if (typeDiff !== 0) return typeDiff;
      return a.name.localeCompare(b.name);
    });
  }

  // Render the meal list
  function renderMeals() {
    updateMealCount();

    const searchTerm = searchInput.value.trim().toLowerCase();
    clearSearchBtn.hidden = searchTerm.length === 0;

    // Filter meals if search term is provided
    const filteredMeals = meals.filter(meal => {
      if (!searchTerm) return true;
      const timeStr = meal.cookingTime ? `${meal.cookingTime} mins min` : '';
      return (
        meal.name.toLowerCase().includes(searchTerm) ||
        meal.day.toLowerCase().includes(searchTerm) ||
        meal.type.toLowerCase().includes(searchTerm) ||
        timeStr.toLowerCase().includes(searchTerm)
      );
    });

    // Clear container
    mealsContainer.innerHTML = '';

    if (meals.length === 0) {
      // Overall empty state (no meals exist)
      emptyStateEl.hidden = false;
      emptyStateEl.style.display = 'flex';
      noResultsStateEl.hidden = true;
      noResultsStateEl.style.display = 'none';
      return;
    }

    // At least one meal exists: empty state must always be hidden
    emptyStateEl.hidden = true;
    emptyStateEl.style.display = 'none';

    if (filteredMeals.length === 0) {
      // Search is active but matched no meals
      noResultsStateEl.hidden = false;
      noResultsStateEl.style.display = 'flex';
      return;
    }

    // Matching meals found: no results state must be hidden
    noResultsStateEl.hidden = true;
    noResultsStateEl.style.display = 'none';

    // Sort filtered meals for neat weekly presentation
    const sorted = sortMeals(filteredMeals);

    sorted.forEach(meal => {
      const card = createMealElement(meal);
      mealsContainer.appendChild(card);
    });
  }

  // Create DOM element for a single meal
  function createMealElement(meal) {
    const item = document.createElement('div');
    item.className = 'meal-item';
    item.setAttribute('role', 'listitem');
    item.dataset.id = meal.id;

    // Content container
    const content = document.createElement('div');
    content.className = 'meal-item-content';

    // Tags (Day and Meal Type)
    const tags = document.createElement('div');
    tags.className = 'meal-item-tags';

    const dayBadge = document.createElement('span');
    dayBadge.className = 'badge badge-day';
    dayBadge.textContent = meal.day;

    const typeBadge = document.createElement('span');
    typeBadge.className = `badge badge-type-${meal.type.toLowerCase()}`;
    typeBadge.textContent = meal.type;

    tags.appendChild(dayBadge);
    tags.appendChild(typeBadge);

    // Cooking Time badge (if specified)
    if (meal.cookingTime) {
      const timeBadge = document.createElement('span');
      timeBadge.className = 'badge badge-time';
      timeBadge.textContent = `⏱️ ${meal.cookingTime} min${meal.cookingTime === 1 ? '' : 's'}`;
      tags.appendChild(timeBadge);
    }

    // Meal Title
    const title = document.createElement('h3');
    title.className = 'meal-item-title';
    title.textContent = meal.name;

    content.appendChild(tags);
    content.appendChild(title);

    // Actions (Edit, Delete)
    const actions = document.createElement('div');
    actions.className = 'meal-item-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'icon-btn edit-btn';
    editBtn.setAttribute('aria-label', `Edit ${meal.name}`);
    editBtn.title = 'Edit meal';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', () => openEditModal(meal.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete ${meal.name}`);
    deleteBtn.title = 'Delete meal';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.addEventListener('click', () => openDeleteModal(meal.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(content);
    item.appendChild(actions);

    return item;
  }

  // Handle Form Validation
  function validateField(inputEl) {
    const isValid = inputEl.value.trim() !== '';
    if (!isValid) {
      inputEl.classList.add('input-error');
    } else {
      inputEl.classList.remove('input-error');
    }
    return isValid;
  }

  // Add Meal
  mealForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const isNameValid = validateField(mealNameInput);
    const isDayValid = validateField(mealDaySelect);
    const isTypeValid = validateField(mealTypeSelect);

    if (!isNameValid || !isDayValid || !isTypeValid) {
      return;
    }

    const cookingTimeVal = mealCookingTimeInput.value.trim();

    const newMeal = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: mealNameInput.value.trim(),
      day: mealDaySelect.value,
      type: mealTypeSelect.value,
      cookingTime: cookingTimeVal ? parseInt(cookingTimeVal, 10) : null,
      createdAt: Date.now()
    };

    meals.push(newMeal);
    saveMeals();
    renderMeals();

    // Reset Form
    mealForm.reset();
    mealNameInput.classList.remove('input-error');
    mealDaySelect.classList.remove('input-error');
    mealTypeSelect.classList.remove('input-error');
    mealNameInput.focus();
  });

  // Clear validation styles on input
  [mealNameInput, mealDaySelect, mealTypeSelect].forEach(input => {
    input.addEventListener('input', () => {
      if (input.value.trim() !== '') {
        input.classList.remove('input-error');
      }
    });
    input.addEventListener('change', () => {
      if (input.value.trim() !== '') {
        input.classList.remove('input-error');
      }
    });
  });

  // Search Input Listener
  searchInput.addEventListener('input', renderMeals);

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderMeals();
    searchInput.focus();
  });

  // Edit Modal Logic
  function openEditModal(mealId) {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;

    editMealId.value = meal.id;
    editMealName.value = meal.name;
    editMealDay.value = meal.day;
    editMealType.value = meal.type;
    editMealCookingTime.value = meal.cookingTime || '';

    editMealName.classList.remove('input-error');
    editModal.hidden = false;
    editMealName.focus();
  }

  function closeEditModal() {
    editModal.hidden = true;
    editMealForm.reset();
  }

  editMealForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const nameVal = editMealName.value.trim();
    if (!nameVal) {
      editMealName.classList.add('input-error');
      return;
    }

    const targetId = editMealId.value;
    const mealIndex = meals.findIndex(m => m.id === targetId);

    if (mealIndex !== -1) {
      const editCookingVal = editMealCookingTime.value.trim();
      meals[mealIndex].name = nameVal;
      meals[mealIndex].day = editMealDay.value;
      meals[mealIndex].type = editMealType.value;
      meals[mealIndex].cookingTime = editCookingVal ? parseInt(editCookingVal, 10) : null;

      saveMeals();
      renderMeals();
    }

    closeEditModal();
  });

  closeEditModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);

  // Delete Modal Logic
  function openDeleteModal(mealId) {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;

    deleteTargetId = mealId;
    deleteMealNameEl.textContent = `"${meal.name}"`;
    deleteModal.hidden = false;
    cancelDeleteBtn.focus();
  }

  function closeDeleteModal() {
    deleteModal.hidden = true;
    deleteTargetId = null;
  }

  confirmDeleteBtn.addEventListener('click', () => {
    if (!deleteTargetId) return;

    meals = meals.filter(m => m.id !== deleteTargetId);
    saveMeals();
    renderMeals();
    closeDeleteModal();
  });

  cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Close modals on overlay backdrop click or Escape key
  [editModal, deleteModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.hidden = true;
        if (modal === deleteModal) deleteTargetId = null;
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!editModal.hidden) closeEditModal();
      if (!deleteModal.hidden) closeDeleteModal();
    }
  });

  // Initialization
  loadMeals();
  renderMeals();
})();

