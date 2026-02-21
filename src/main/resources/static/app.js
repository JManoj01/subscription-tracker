(function () {
  const API = '/api/subscriptions';

  function monthlyEquivalentCents(sub) {
    const c = sub.cost;
    switch (sub.cycle) {
      case 'weekly': return c * (52 / 12);
      case 'monthly': return c;
      case 'quarterly': return c / 3;
      case 'semiannual': return c / 6;
      case 'yearly': return c / 12;
      default: return c;
    }
  }

  function totalMonthlyCents(subs) {
    return subs
      .filter(function (s) { return s.status === 'active'; })
      .reduce(function (acc, s) { return acc + monthlyEquivalentCents(s); }, 0);
  }

  function daysBetween(fromDate, toDate) {
    var from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    var to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    return Math.round((to - from) / (1000 * 60 * 60 * 24));
  }

  function trialDaysLeft(sub) {
    if (!sub.isTrial || !sub.trialEndDate) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var end = new Date(sub.trialEndDate);
    return daysBetween(today, end);
  }

  function endingSoon(subs) {
    return subs.filter(function (sub) {
      var days = trialDaysLeft(sub);
      return days !== null && days >= 0 && days <= 3;
    });
  }

  function fetchSubscriptions() {
    return fetch(API, { credentials: 'include' }).then(function (r) {
      if (!r.ok) throw new Error('Failed to fetch subscriptions');
      return r.json();
    });
  }

  function render(subs) {
    var tbody = document.getElementById('sub-tbody');
    var emptyMsg = document.getElementById('empty-message');
    var tableWrap = document.getElementById('table-wrap');
    var countEl = document.getElementById('sub-count');
    var totalEl = document.getElementById('monthly-total-label');
    var alertBox = document.getElementById('trial-alert');
    var alertList = document.getElementById('trial-alert-list');

    countEl.textContent = subs.length;
    var totalCents = totalMonthlyCents(subs);
    totalEl.textContent = 'ESTIMATED TOTAL MONTHLY COST: $' + (totalCents / 100).toFixed(2);

    var soon = endingSoon(subs);
    if (soon.length > 0) {
      alertBox.style.display = 'block';
      alertList.innerHTML = '';
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      soon.forEach(function (sub) {
        var end = new Date(sub.trialEndDate);
        var days = daysBetween(today, end);
        var li = document.createElement('li');
        li.textContent = sub.name + ' trial ends in ' + days + ' days!';
        alertList.appendChild(li);
      });
    } else {
      alertBox.style.display = 'none';
    }

    if (subs.length === 0) {
      tableWrap.style.display = 'none';
      emptyMsg.style.display = 'block';
      return;
    }
    tableWrap.style.display = 'block';
    emptyMsg.style.display = 'none';

    tbody.innerHTML = '';
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    subs.forEach(function (sub) {
      var daysLeft = trialDaysLeft(sub);
      var isExpired = daysLeft !== null && daysLeft < 0;
      var tr = document.createElement('tr');
      if (isExpired) tr.className = 'row-expired';
      tr.innerHTML =
        '<td><strong>' + escapeHtml(sub.name) + '</strong></td>' +
        '<td>$' + (sub.cost / 100).toFixed(2) + '</td>' +
        '<td>' + escapeHtml(sub.cycle) + '</td>' +
        '<td>' + trialInfo(sub, daysLeft) + '</td>' +
        '<td><button type="button" data-id="' + sub.id + '" class="btn-delete">Delete</button></td>';
      tr.querySelector('.btn-delete').addEventListener('click', function () {
        if (confirm('Delete?')) deleteSubscription(sub.id);
      });
      tbody.appendChild(tr);
    });
  }

  function trialInfo(sub, daysLeft) {
    if (!sub.isTrial) return 'N/A';
    if (daysLeft === null) return 'N/A';
    var span = document.createElement('span');
    if (daysLeft <= 3 && daysLeft >= 0) span.className = 'trial-warning';
    span.textContent = daysLeft < 0 ? 'EXPIRED' : daysLeft + ' days left';
    return span.outerHTML;
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function deleteSubscription(id) {
    fetch(API + '/' + id, { method: 'DELETE', credentials: 'include' }).then(function (r) {
      if (r.status === 204 || r.status === 404) load();
      else throw new Error('Delete failed');
    }).catch(function () { alert('Failed to delete'); });
  }

  function load() {
    fetchSubscriptions().then(render).catch(function () {
      document.getElementById('sub-count').textContent = '0';
      document.getElementById('empty-message').style.display = 'block';
      document.getElementById('table-wrap').style.display = 'none';
    });
  }

  var inputTrial = document.getElementById('input-trial');
  var trialDateWrap = document.getElementById('trial-date-wrap');
  var inputTrialEnd = document.getElementById('input-trial-end');
  inputTrial.addEventListener('change', function () {
    trialDateWrap.style.display = this.checked ? 'block' : 'none';
    if (!this.checked) inputTrialEnd.removeAttribute('required');
    else inputTrialEnd.setAttribute('required', 'required');
  });

  document.getElementById('add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('input-name').value.trim();
    var cost = parseFloat(document.getElementById('input-cost').value, 10);
    var cycle = document.getElementById('input-cycle').value;
    var isTrial = document.getElementById('input-trial').checked;
    var trialEnd = document.getElementById('input-trial-end').value;
    if (!name || isNaN(cost)) return;
    var body = {
      name: name,
      cost: Math.round(cost * 100),
      cycle: cycle,
      startDate: new Date().toISOString(),
      isTrial: isTrial,
      trialEndDate: isTrial && trialEnd ? new Date(trialEnd).toISOString() : null,
      status: 'active',
      url: null
    };
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    }).then(function (r) {
      if (r.ok) {
        document.getElementById('input-name').value = '';
        document.getElementById('input-cost').value = '';
        document.getElementById('input-trial').checked = false;
        document.getElementById('input-trial-end').value = '';
        trialDateWrap.style.display = 'none';
        load();
      } else {
        return r.json().then(function (err) { throw new Error(err.message || 'Create failed'); });
      }
    }).catch(function (err) {
      alert(err.message || 'Failed to add subscription');
    });
  });

  load();
})();
