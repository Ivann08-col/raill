import json


def test_post_mood(client, token):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    payload = {'valor': 5, 'nota': 'Me siento bien'}
    resp = client.post('/api/dashboard/mood', data=json.dumps(payload), headers=headers)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['valor'] == 5
    assert data['nota'] == 'Me siento bien'


def test_get_mood_empty_then_with_entries(client, token):
    headers = {
        'Authorization': f'Bearer {token}'
    }

    # Initially there may be at least the previous test's entry depending on test order.
    resp = client.get('/api/dashboard/mood?days=7&limit=10', headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'entries' in data and 'distribution' in data

    # Post two more entries and verify distribution changes
    payload1 = {'valor': 4, 'nota': 'Bien'}
    payload2 = {'valor': 2, 'nota': 'No tan bien'}
    client.post('/api/dashboard/mood', data=json.dumps(payload1), headers={**headers, 'Content-Type': 'application/json'})
    client.post('/api/dashboard/mood', data=json.dumps(payload2), headers={**headers, 'Content-Type': 'application/json'})

    resp2 = client.get('/api/dashboard/mood?days=7&limit=10', headers=headers)
    assert resp2.status_code == 200
    data2 = resp2.get_json()
    assert len(data2['entries']) >= 2
    # distribution keys
    for k in ['Excelente', 'Bien', 'Regular', 'Bajo']:
        assert k in data2['distribution']
